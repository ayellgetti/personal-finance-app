import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleStatus } from "@/components/modules/shared";
import { CONTACT_TYPE_LABELS, TASK_STATUS_LABELS, formatMoney } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_CONTACT_TYPES, CRM_PERMISSIONS, CRM_TASK_STATUSES } from "@/types/crm";

export function DashboardModule() {
  const { status: sessionStatus, hasPermission, dashboard, loadDashboard } = useCrm();
  const sessionReady = sessionStatus === "ready";
  const allowed = hasPermission(CRM_PERMISSIONS.dashboardRead);

  useEffect(() => {
    if (sessionReady && allowed) void loadDashboard();
  }, [sessionReady, allowed, loadDashboard]);

  const snapshot = dashboard.data;

  return (
    <ModuleStatus
      sessionReady={sessionReady}
      allowed={allowed}
      status={dashboard.status}
      errorMessage={dashboard.errorMessage}
      empty={false}
      emptyLabel=""
      onRetry={() => void loadDashboard()}
    >
      {snapshot ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Contacts by type</CardTitle>
              <CardDescription>Active parties in the CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {CRM_CONTACT_TYPES.map((type) => (
                <p key={type} className="flex justify-between">
                  <span>{CONTACT_TYPE_LABELS[type]}</span>
                  <span className="font-medium">{snapshot.contactsByType[type] ?? 0}</span>
                </p>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Enquiries</CardTitle>
              <CardDescription>Open versus closed cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Open</span>
                <span className="font-medium">{snapshot.enquiries.open}</span>
              </p>
              <p className="flex justify-between">
                <span>Won</span>
                <span className="font-medium">{snapshot.enquiries.won}</span>
              </p>
              <p className="flex justify-between">
                <span>Lost</span>
                <span className="font-medium">{snapshot.enquiries.lost}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Overdue follow-ups</CardTitle>
              <CardDescription>Pending items past due</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{snapshot.overdueFollowUps}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Payments this month</CardTitle>
              <CardDescription>Paid collections in the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{formatMoney(snapshot.paymentsPaidThisMonth)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)] md:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle>Tasks by status</CardTitle>
              <CardDescription>Work on the board</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {CRM_TASK_STATUSES.map((taskStatus) => (
                <p key={taskStatus} className="flex justify-between">
                  <span>{TASK_STATUS_LABELS[taskStatus]}</span>
                  <span className="font-medium">{snapshot.tasksByStatus[taskStatus] ?? 0}</span>
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </ModuleStatus>
  );
}
