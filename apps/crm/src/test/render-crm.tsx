import { type ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrmProvider } from "@/lib/crm/store";

export function renderCrm(ui: ReactNode) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MemoryRouter>
        <TooltipProvider delayDuration={0}>
          <CrmProvider>{ui}</CrmProvider>
        </TooltipProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
