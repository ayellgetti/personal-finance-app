import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PWA_INSTALL_DISMISSED_KEY = "fp-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

type PwaInstallDialogProps = {
  appName: string;
};

export function PwaInstallDialog({ appName }: PwaInstallDialogProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1") {
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "1") {
        return;
      }
      const next = event as BeforeInstallPromptEvent;
      if (typeof next.prompt !== "function") {
        return;
      }
      setInstallEvent(next);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "1");
    setOpen(false);
    setInstallEvent(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dismiss();
        }
      }}
    >
      <DialogContent className="max-w-sm text-center sm:text-left">
        <DialogHeader>
          <DialogTitle>Install {appName}</DialogTitle>
          <DialogDescription>
            Add {appName} to your home screen for quick access and a native app experience.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Install the app for faster loading and a full-screen experience.
        </p>
        <DialogFooter className="gap-2 sm:justify-stretch">
          <Button className="w-full sm:w-auto" onClick={() => void install()}>
            <Download />
            Install App
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={dismiss}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
