import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAccessToken } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/crm/display";
import { listNotifications, markNotificationRead } from "@/lib/crm/remote";
import type { CrmMessage } from "@/types/crm";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CrmMessage[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;
    void listNotifications({ limit: 20 })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setUnread(page.items.filter((item) => item.read === 0).length);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" size="icon" className="relative rounded-xl" aria-label="Notifications" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread}
          </span>
        ) : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>In-app messages sent to you.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : null}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-xl border border-border p-3 text-left"
                onClick={() => {
                  if (item.read === 1) return;
                  void markNotificationRead(item.id).then((message) => {
                    setItems((current) => current.map((row) => (row.id === message.id ? message : row)));
                    setUnread((count) => Math.max(0, count - 1));
                  });
                }}
              >
                <p className="text-sm font-medium">{item.subject || "Notification"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(item.sentAt || item.scheduledAt)}
                  {item.read === 0 ? " · Unread" : ""}
                </p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
