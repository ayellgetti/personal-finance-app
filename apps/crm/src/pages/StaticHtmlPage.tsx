import { useCallback, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import sharedCss from "./use-case-shared.css?raw";

function withSharedStyles(html: string) {
  const style = `<style>${sharedCss}</style>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${style}</head>`);
  }
  return `${style}${html}`;
}

export function StaticHtmlPage({ html, title }: { html: string; title: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dark = resolvedTheme === "dark";
  const srcDoc = withSharedStyles(html);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "guide-theme" && (event.data.theme === "light" || event.data.theme === "dark")) {
        setTheme(event.data.theme);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setTheme]);

  const applyToIframe = useCallback(() => {
    const root = iframeRef.current?.contentDocument?.documentElement;
    if (!root) return;
    root.classList.toggle("dark", dark);
    root.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    applyToIframe();
  }, [applyToIframe, resolvedTheme]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={srcDoc}
      onLoad={applyToIframe}
      className={`fixed inset-0 h-full w-full border-0 ${dark ? "bg-[#0b161c]" : "bg-[#f4faf7]"}`}
    />
  );
}

