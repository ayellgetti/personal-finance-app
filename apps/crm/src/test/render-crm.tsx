import { type ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CrmProvider } from "@/lib/crm/store";

export function renderCrm(ui: ReactNode) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MemoryRouter>
        <CrmProvider>{ui}</CrmProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
