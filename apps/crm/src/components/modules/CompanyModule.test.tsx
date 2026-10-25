/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CompanyModule } from "@/components/modules/CompanyModule";
import { adminMe, fetchCompanyProfile, fetchCrmMe, updateCompanyProfile } from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/crm/remote", async () => import("@/test/crm-remote-mock"));

describe("CompanyModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCrmMe.mockResolvedValue(adminMe);
    fetchCompanyProfile.mockResolvedValue({
      saved: { name: "", details: "", contactName: "", contactMobile: "", logoUrl: "" },
      defaults: {
        name: "Env Banquet",
        details: "12 Lake Road",
        contactName: "Rita Shah",
        contactMobile: "+919800000000",
        logoUrl: "",
      },
      company: {
        name: "Env Banquet",
        details: "12 Lake Road",
        contactName: "Rita Shah",
        contactMobile: "+919800000000",
        logoUrl: "",
      },
    });
    updateCompanyProfile.mockImplementation(async (input: unknown) => {
      const body = input as {
        name: string;
        details: string;
        contactName: string;
        contactMobile: string;
      };
      return {
        saved: { ...body, logoUrl: "" },
        defaults: {
          name: "Env Banquet",
          details: "12 Lake Road",
          contactName: "Rita Shah",
          contactMobile: "+919800000000",
          logoUrl: "",
        },
        company: {
          name: body.name || "Env Banquet",
          details: body.details || "12 Lake Road",
          contactName: body.contactName || "Rita Shah",
          contactMobile: body.contactMobile || "+919800000000",
          logoUrl: "",
        },
      };
    });
  });

  it("shows environment defaults as placeholders and saves an override", async () => {
    renderCrm(<CompanyModule />);
    const name = await screen.findByLabelText("Company name");
    expect(name).toHaveAttribute("placeholder", "Env Banquet");
    expect(screen.getByLabelText("Contact person")).toHaveAttribute("placeholder", "Rita Shah");
    expect(screen.getByLabelText("Mobile no.")).toHaveAttribute("placeholder", "+919800000000");

    fireEvent.change(name, { target: { value: "Saved Hall" } });
    fireEvent.click(screen.getByRole("button", { name: "Save company" }));

    await waitFor(() => {
      expect(updateCompanyProfile).toHaveBeenCalledWith({
        name: "Saved Hall",
        details: "",
        contactName: "",
        contactMobile: "",
      });
    });
  });
});
