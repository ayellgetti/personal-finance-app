/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import Company from "@/pages/Company";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  fetchCompanyProfile: vi.fn(),
  updateCompanyProfile: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const DEFAULTS = {
  name: "Env Banquet",
  details: "12 Lake Road",
  contactName: "Rita Shah",
  contactMobile: "+919800000000",
  logoUrl: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [CRM_PERMISSIONS.companyRead, CRM_PERMISSIONS.companyUpdate];
  remote.fetchCompanyProfile.mockResolvedValue({
    saved: { name: "", details: "", contactName: "", contactMobile: "", logoUrl: "" },
    defaults: DEFAULTS,
    company: DEFAULTS,
  });
  remote.updateCompanyProfile.mockImplementation(async (input: { name: string }) => ({
    saved: { ...input, logoUrl: "" },
    defaults: DEFAULTS,
    company: { ...DEFAULTS, name: input.name || DEFAULTS.name },
  }));
});

describe("company", () => {
  it("is forbidden without crm.company.read", () => {
    state.permissions = [];
    renderMobile(<Company />, ["/company"]);
    expect(screen.getByText("Your role cannot view the company profile.")).toBeInTheDocument();
    expect(remote.fetchCompanyProfile).not.toHaveBeenCalled();
  });

  it("shows environment defaults as placeholders and saves an override", async () => {
    renderMobile(<Company />, ["/company"]);

    const name = await screen.findByLabelText("Company name");
    expect(name).toHaveAttribute("placeholder", "Env Banquet");
    expect(screen.getByLabelText("Contact person")).toHaveAttribute("placeholder", "Rita Shah");
    expect(screen.getByLabelText("Mobile no.")).toHaveAttribute("placeholder", "+919800000000");

    fireEvent.change(name, { target: { value: "Saved Hall" } });
    fireEvent.click(screen.getByRole("button", { name: "Save company" }));

    await waitFor(() =>
      expect(remote.updateCompanyProfile).toHaveBeenCalledWith({
        name: "Saved Hall",
        details: "",
        contactName: "",
        contactMobile: "",
      }),
    );
  });

  it("is read-only without crm.company.update", async () => {
    state.permissions = [CRM_PERMISSIONS.companyRead];
    renderMobile(<Company />, ["/company"]);

    expect(await screen.findByLabelText("Company name")).toBeDisabled();
    expect(screen.getByLabelText("Organization details")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save company" })).not.toBeInTheDocument();
    expect(screen.getByText("An admin or manager can change these details.")).toBeInTheDocument();
  });
});
