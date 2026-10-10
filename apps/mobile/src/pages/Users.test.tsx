/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import Users from "@/pages/Users";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmStaffUser } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listCrmUsers: vi.fn(),
  listRoles: vi.fn(),
  createCrmUser: vi.fn(),
  updateCrmUser: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const staff: CrmStaffUser = {
  id: "u1",
  firstName: "Asha",
  lastName: "Rao",
  email: "asha@example.com",
  mobileNo: "9876543210",
  dob: "1992-04-01",
  gender: "female",
  countryCode: "+91",
  roleIds: ["r-sales"],
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.usersRead,
    CRM_PERMISSIONS.usersCreate,
    CRM_PERMISSIONS.usersUpdate,
    CRM_PERMISSIONS.rolesRead,
  ];
  remote.listCrmUsers.mockResolvedValue(pageOf([staff]));
  remote.listRoles.mockResolvedValue([{ id: "r-sales", name: "Sales", slug: "sales", permissionIds: [] }]);
  remote.updateCrmUser.mockResolvedValue(staff);
});

describe("users", () => {
  it("is forbidden without crm.users.read", () => {
    state.permissions = [];
    renderMobile(<Users />, ["/users"]);
    expect(screen.getByText("Your role cannot view users.")).toBeInTheDocument();
  });

  it("lists staff with their role names", async () => {
    renderMobile(<Users />, ["/users"]);
    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Sales")).toBeInTheDocument());
  });

  it("requires a password and a role for new staff", async () => {
    renderMobile(<Users />, ["/users?new=1"]);
    fireEvent.click(await screen.findByRole("button", { name: "Create staff" }));
    expect(await screen.findByText("Password must be 8 to 72 characters")).toBeInTheDocument();
    expect(screen.getByText("Choose at least one role")).toBeInTheDocument();
    expect(remote.createCrmUser).not.toHaveBeenCalled();
  });

  it("edits staff without sending a password", async () => {
    renderMobile(<Users />, ["/users"]);
    fireEvent.click(await screen.findByText("Asha Rao"));
    expect(await screen.findByRole("heading", { name: "Edit staff" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save staff" }));
    await waitFor(() =>
      expect(remote.updateCrmUser).toHaveBeenCalledWith(
        "u1",
        expect.not.objectContaining({ password: expect.anything() }),
      ),
    );
  });
});
