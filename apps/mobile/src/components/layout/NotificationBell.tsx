import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAccessToken } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/mobile/format";
import { listNotifications, markNotificationRead } from "@/lib/mobile/remote";
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
      <Button type="button" variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications" onClick={() => setOpen(true)}>
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        ) : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>In-app messages sent to you.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3 overflow-y-auto pb-6">
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : null}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-2xl border border-border p-3 text-left"
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
