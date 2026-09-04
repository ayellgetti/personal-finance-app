import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarModule } from "@/components/modules/CalendarModule";
import { ClientsModule } from "@/components/modules/ClientsModule";
import { ContactsModule } from "@/components/modules/ContactsModule";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { EnquiriesModule } from "@/components/modules/EnquiriesModule";
import { FollowUpsModule } from "@/components/modules/FollowUpsModule";
import { PaymentsModule } from "@/components/modules/PaymentsModule";
import { RolesModule } from "@/components/modules/RolesModule";
import { TasksModule } from "@/components/modules/TasksModule";
import { UsersModule } from "@/components/modules/UsersModule";
import { useCrm } from "@/lib/crm/store";
import type { CrmViewId } from "@/types/crm";

const META: Record<CrmViewId, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Your CRM workspace at a glance" },
  contacts: { title: "Contacts", description: "People and companies in the pipeline" },
  enquiries: { title: "Enquiries", description: "Sales cases from first touch to close" },
  followUps: { title: "Follow-ups", description: "Next actions and overdue work" },
  clients: { title: "Clients", description: "Converted commercial records" },
  payments: { title: "Payments", description: "Collections against clients" },
  tasks: { title: "Tasks", description: "Work items across the team" },
  calendar: { title: "Calendar", description: "Follow-ups, tasks, and meetings" },
  users: { title: "Users", description: "Staff accounts and role assignment" },
  roles: { title: "Roles", description: "Permission sets for CRM access" },
};

const Index = () => {
  const { permissions } = useCrm();
  const [view, setView] = useState<CrmViewId>("dashboard");
  const [contactHighlightId, setContactHighlightId] = useState<string | null>(null);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const meta = META[view];

  const onSelect = (next: CrmViewId) => {
    setView(next);
    if (next !== "contacts") setContactHighlightId(null);
    if (next !== "payments") setPaymentClientId(null);
  };

  return (
    <AppLayout
      active={view}
      permissions={permissions}
      onSelect={onSelect}
      title={meta.title}
      description={meta.description}
    >
      {view === "dashboard" ? <DashboardModule /> : null}
      {view === "contacts" ? <ContactsModule highlightId={contactHighlightId} /> : null}
      {view === "enquiries" ? <EnquiriesModule /> : null}
      {view === "followUps" ? <FollowUpsModule /> : null}
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
        />
      ) : null}
      {view === "payments" ? (
        <PaymentsModule clientId={paymentClientId} onClearClientFilter={() => setPaymentClientId(null)} />
      ) : null}
      {view === "tasks" ? <TasksModule /> : null}
      {view === "calendar" ? <CalendarModule /> : null}
      {view === "users" ? <UsersModule /> : null}
      {view === "roles" ? <RolesModule /> : null}
    </AppLayout>
  );
};

export default Index;
