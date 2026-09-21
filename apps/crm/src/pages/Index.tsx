import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarModule, type CalendarCreateTarget } from "@/components/modules/CalendarModule";
import { ClientsModule } from "@/components/modules/ClientsModule";
import { ContactsModule } from "@/components/modules/ContactsModule";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { EnquiriesModule } from "@/components/modules/EnquiriesModule";
import { FollowUpsModule, type FollowUpDueFilter } from "@/components/modules/FollowUpsModule";
import { PaymentsModule } from "@/components/modules/PaymentsModule";
import { ProfileModule } from "@/components/modules/ProfileModule";
import { RolesModule } from "@/components/modules/RolesModule";
import { TasksModule } from "@/components/modules/TasksModule";
import { UsersModule } from "@/components/modules/UsersModule";
import { useCrm } from "@/lib/crm/store";
import type { CrmViewId } from "@/types/crm";

const META: Record<CrmViewId, { title: string; description: string }> = {
  profile: { title: "Profile", description: "Your account and roles" },
  dashboard: { title: "Dashboard", description: "Your CRM workspace at a glance" },
  contacts: { title: "Contacts", description: "People and companies in the pipeline" },
  enquiries: { title: "Enquiries", description: "Sales cases from first touch to close" },
  followUps: { title: "Follow-ups", description: "Next actions and overdue work" },
  clients: { title: "Booked", description: "Converted bookings after an enquiry is closed" },
  payments: { title: "Payments", description: "Collections against booked records" },
  tasks: { title: "Tasks", description: "Work items across the team" },
  calendar: { title: "Calendar", description: "Tasks and meetings" },
  users: { title: "Users", description: "Staff accounts and role assignment" },
  roles: { title: "Roles", description: "Permission sets for CRM access" },
};

const Index = () => {
  const { permissions } = useCrm();
  const [view, setView] = useState<CrmViewId>("dashboard");
  const [contactHighlightId, setContactHighlightId] = useState<string | null>(null);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const [followUpDueFilter, setFollowUpDueFilter] = useState<FollowUpDueFilter>("all");
  const [createRequest, setCreateRequest] = useState<{ target: CalendarCreateTarget; date: string } | null>(null);
  const meta = META[view];

  const onSelect = (next: CrmViewId) => {
    setView(next);
    if (next !== "contacts") setContactHighlightId(null);
    if (next !== "payments") setPaymentClientId(null);
    if (next !== "followUps") setFollowUpDueFilter("all");
  };

  const createDateFor = (target: CalendarCreateTarget) =>
    createRequest?.target === target ? createRequest.date : null;
  const clearCreateRequest = () => setCreateRequest(null);

  return (
    <AppLayout
      active={view}
      permissions={permissions}
      onSelect={onSelect}
      title={meta.title}
      description={meta.description}
    >
      {view === "dashboard" ? (
        <DashboardModule
          onOpenFollowUps={(dueFilter) => {
            setFollowUpDueFilter(dueFilter);
            setView("followUps");
          }}
        />
      ) : null}
      {view === "contacts" ? <ContactsModule highlightId={contactHighlightId} /> : null}
      {view === "enquiries" ? (
        <EnquiriesModule createOnDate={createDateFor("enquiries")} onCreateOpened={clearCreateRequest} />
      ) : null}
      {view === "followUps" ? (
        <FollowUpsModule
          initialDueFilter={followUpDueFilter}
          createOnDate={createDateFor("followUps")}
          onCreateOpened={clearCreateRequest}
        />
      ) : null}
      {view === "clients" ? (
        <ClientsModule
          onOpenContact={(contactId) => {
            setContactHighlightId(contactId);
            setView("contacts");
          }}
          onOpenPayments={(clientId) => {
            setPaymentClientId(clientId);
            setView("payments");
          }}
          createOnDate={createDateFor("clients")}
          onCreateOpened={clearCreateRequest}
        />
      ) : null}
      {view === "payments" ? (
        <PaymentsModule
          clientId={paymentClientId}
          onClearClientFilter={() => setPaymentClientId(null)}
          createOnDate={createDateFor("payments")}
          onCreateOpened={clearCreateRequest}
        />
      ) : null}
      {view === "tasks" ? <TasksModule /> : null}
      {view === "calendar" ? (
        <CalendarModule
          onOpenContact={(contactId) => {
            setContactHighlightId(contactId);
            setView("contacts");
          }}
          onOpenPayments={(clientId) => {
            setPaymentClientId(clientId);
            setView("payments");
          }}
          onCreateFor={(target, date) => {
            setCreateRequest({ target, date });
            onSelect(target);
          }}
        />
      ) : null}
      {view === "users" ? <UsersModule /> : null}
      {view === "roles" ? <RolesModule /> : null}
      {view === "profile" ? <ProfileModule /> : null}
    </AppLayout>
  );
};

export default Index;
