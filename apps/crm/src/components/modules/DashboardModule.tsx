import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePage, ModuleStatus } from "@/components/modules/shared";
import { CONTACT_TYPE_LABELS, TASK_STATUS_LABELS, formatDate, formatMoney } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_CONTACT_TYPES, CRM_PERMISSIONS, CRM_TASK_STATUSES } from "@/types/crm";

export function DashboardModule({
  onOpenFollowUps,
}: {
  onOpenFollowUps?: (dueFilter: "today") => void;
}) {
  const { status: sessionStatus, hasPermission, dashboard, loadDashboard } = useCrm();
  const sessionReady = sessionStatus === "ready";
  const allowed = hasPermission(CRM_PERMISSIONS.dashboardRead);

  useEffect(() => {
    if (sessionReady && allowed) void loadDashboard();
  }, [sessionReady, allowed, loadDashboard]);

  const snapshot = dashboard.data;

  return (
    <ModulePage crumb="Dashboard">
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
              <CardTitle>Leads generated today</CardTitle>
              <CardDescription>New enquiries created today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{snapshot.leadsGeneratedToday}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Customer due dates</CardTitle>
              <CardDescription>Open enquiries due today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-display text-3xl font-bold">{snapshot.customerDueToday}</p>
              {snapshot.customerDueItems.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {snapshot.customerDueItems.slice(0, 4).map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span className="truncate">{item.title}</span>
                      <span>{formatDate(item.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No customer due dates today</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Overdue follow-ups</CardTitle>
              <CardDescription>Open enquiries past next follow-up date</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{snapshot.overdueFollowUps}</p>
            </CardContent>
          </Card>
          <button
            type="button"
            aria-label="Follow-ups for today"
            className="cursor-pointer rounded-2xl border bg-card text-left text-card-foreground shadow-[var(--shadow-card)] hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpenFollowUps?.("today")}
          >
            <span className="flex flex-col space-y-1.5 p-6">
              <span className="text-2xl font-semibold leading-none tracking-tight">Follow-ups for today</span>
              <span className="text-sm text-muted-foreground">Open enquiries due for follow-up today</span>
            </span>
            <span className="block p-6 pt-0">
              <span className="font-display text-3xl font-bold">{snapshot.followUpsToday}</span>
            </span>
          </button>
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Open enquiries</CardTitle>
              <CardDescription>Cases that are not closed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Open</span>
                <span className="font-medium">{snapshot.enquiries.open}</span>
              </p>
              <p className="flex justify-between">
                <span>Closed</span>
                <span className="font-medium">{snapshot.enquiries.closed}</span>
              </p>
            </CardContent>
          </Card>
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
              <CardTitle>Transaction this month</CardTitle>
              <CardDescription>Paid income and expense in the current month</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="font-display text-2xl font-bold">{formatMoney(snapshot.paymentsIncomeThisMonth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expense</p>
                <p className="font-display text-2xl font-bold">{formatMoney(snapshot.paymentsExpenseThisMonth)}</p>
              </div>
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
    </ModulePage>
  );
}
