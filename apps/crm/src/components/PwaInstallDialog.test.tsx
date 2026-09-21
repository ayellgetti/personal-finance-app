/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PwaInstallDialog } from "./PwaInstallDialog";

const DISMISSED_KEY = "crm-pwa-install-dismissed";

function dispatchInstallPrompt() {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(event, "prompt", { value: prompt });
  window.dispatchEvent(event);
  return { prompt };
}

describe("PwaInstallDialog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows install copy when the browser fires beforeinstallprompt", async () => {
    render(<PwaInstallDialog appName="Sales CRM" />);
    act(() => {
      dispatchInstallPrompt();
    });

    expect(await screen.findByRole("heading", { name: "Install Sales CRM" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install App" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maybe Later" })).toBeInTheDocument();
  });

  it("hides after Maybe Later and does not reopen", async () => {
    render(<PwaInstallDialog appName="Sales CRM" />);
    act(() => {
      dispatchInstallPrompt();
    });
    await screen.findByRole("heading", { name: "Install Sales CRM" });

    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Install Sales CRM" })).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(DISMISSED_KEY)).toBe("1");

    act(() => {
      dispatchInstallPrompt();
    });
    expect(screen.queryByRole("heading", { name: "Install Sales CRM" })).not.toBeInTheDocument();
  });
});
