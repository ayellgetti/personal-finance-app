import { describe, expect, it } from "vitest";
import {
  toContactInput,
  toReminderInput,
  validateContact,
  validateEnquiry,
  validateFollowUp,
  validatePasswordChange,
  validatePayment,
  validateReminder,
  validateRole,
  validateStaffUser,
  validateTask,
} from "@/lib/mobile/validate";

describe("mobile form validation", () => {
  it("rejects a contact mobile that the API would reject", () => {
    const errors = validateContact({
      name: "Ada",
      mobile: "123",
      email: "not-an-email",
      companyName: "",
      notes: "",
    });
    expect(errors.mobile).toBeTruthy();
    expect(errors.email).toBeTruthy();
  });

  it("trims a valid contact before create", () => {
    expect(
      toContactInput({
        name: " Ada ",
        mobile: "+919876543210",
        type: "lead",
        email: " ada@example.com ",
        companyName: "",
        notes: "  ",
      }),
    ).toEqual({
      name: "Ada",
      mobile: "+919876543210",
      type: "lead",
      email: "ada@example.com",
      companyName: null,
      notes: null,
    });
  });

  it("requires a future due date and a close reason when closing", () => {
    const errors = validateEnquiry({
      contactId: "c1",
      title: "Wedding",
      source: "Walk-in",
      dueDate: "2000-01-01",
      notes: "",
      status: "closed",
      closedReason: "",
    });
    expect(errors.dueDate).toMatch(/today or in the future/);
    expect(errors.closedReason).toBeTruthy();
  });

  it("requires the next follow-up and a reason when the booked outcome is Closed", () => {
    const errors = validateFollowUp({
      enquiryId: "",
      dueDate: "",
      dueTime: "",
      nextDate: "",
      notes: "",
      requireClosedReason: true,
      closedReason: " ",
    });
    expect(errors.enquiryId).toBeTruthy();
    expect(errors.nextFollowupDate).toBeTruthy();
    expect(errors.closedReason).toBeTruthy();
  });

  it("rejects a non-positive payment amount", () => {
    expect(validatePayment({ referenceId: "", amount: "0", reference: "", paidAt: "" }).amount).toBeTruthy();
  });

  it("builds a 30-minute reminder and rejects a blank title", () => {
    expect(validateReminder({ title: " ", remindAt: "", notes: "" }).title).toBeTruthy();
    const input = toReminderInput({
      title: " Call ",
      remindAt: "2026-10-12T10:00",
      notes: "",
      contactId: "",
    });
    expect(input.title).toBe("Call");
    expect(new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime()).toBe(30 * 60 * 1000);
  });

  it("rejects a blank task title and a short staff password", () => {
    expect(validateTask({ title: "", description: "" }).title).toBeTruthy();
    const staff = validateStaffUser({
      firstName: "A",
      lastName: "B",
      dob: "1990-01-01",
      gender: "female",
      countryCode: "+91",
      mobileNo: "9876543210",
      email: "a@example.com",
      password: "short",
      roleIds: [],
      editing: false,
    });
    expect(staff.password).toBeTruthy();
    expect(staff.roleIds).toBeTruthy();
  });

  it("checks password confirmation and role name length", () => {
    expect(
      validatePasswordChange({ currentPassword: "old-password", newPassword: "new-password", confirmPassword: "nope" })
        .confirmPassword,
    ).toBeTruthy();
    expect(validateRole({ name: "A" }).name).toBeTruthy();
    expect(validateRole({ name: "Front desk", permissionIds: [] }).permissionIds).toBeTruthy();
  });
});
