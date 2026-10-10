/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import Roles from "@/pages/Roles";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listRoles: vi.fn(),
  listPermissions: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [CRM_PERMISSIONS.rolesRead, CRM_PERMISSIONS.rolesUpdate];
  remote.listRoles.mockResolvedValue([
    { id: "r-admin", name: "Admin", slug: "admin", permissionIds: ["p1"] },
    { id: "r-desk", name: "Front desk", slug: "front-desk", permissionIds: [] },
  ]);
  remote.listPermissions.mockResolvedValue([
    { id: "p1", code: "crm.clients.read", name: "Read booked", description: "Open the booked list" },
    { id: "p2", code: "crm.clients.create", name: "Create booked", description: "Add booked records" },
  ]);
  remote.updateRole.mockResolvedValue({ id: "r-desk", name: "Front desk", slug: "front-desk", permissionIds: ["p1"] });
});

describe("roles", () => {
  it("is forbidden without crm.roles.read", () => {
    state.permissions = [];
    renderMobile(<Roles />, ["/roles"]);
    expect(screen.getByText("Your role cannot view roles.")).toBeInTheDocument();
  });

  it("marks built-in roles and groups permissions with descriptions", async () => {
    renderMobile(<Roles />, ["/roles"]);
    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(screen.getAllByText("Built-in")).toHaveLength(1);

    fireEvent.click(screen.getByText("Front desk"));
    expect(await screen.findByRole("heading", { name: "Edit role" })).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("Open the booked list")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /Read booked/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));
    await waitFor(() =>
      expect(remote.updateRole).toHaveBeenCalledWith("r-desk", { name: "Front desk", permissionIds: ["p1"] }),
    );
  });

  it("is read-only without crm.roles.update", async () => {
    state.permissions = [CRM_PERMISSIONS.rolesRead];
    renderMobile(<Roles />, ["/roles"]);
    fireEvent.click(await screen.findByText("Front desk"));
    expect(await screen.findByLabelText("Name")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "New role" })).not.toBeInTheDocument();
  });

  it("rejects a one-letter role name", async () => {
    renderMobile(<Roles />, ["/roles?new=1"]);
    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "Create role" }));
    expect(await screen.findByText("Name must be 2 to 80 characters")).toBeInTheDocument();
    expect(remote.createRole).not.toHaveBeenCalled();
  });
});
