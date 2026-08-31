import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import courseHtml from "./course.html?raw";

export default function Course() {
  const { resolvedTheme, setTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dark = resolvedTheme === "dark";

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "guide-theme" && (event.data.theme === "light" || event.data.theme === "dark")) {
        setTheme(event.data.theme);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setTheme]);

  const applyToIframe = () => {
    const root = iframeRef.current?.contentDocument?.documentElement;
    if (!root) return;
    root.classList.toggle("dark", dark);
    root.dataset.theme = dark ? "dark" : "light";
  };

  useEffect(() => {
    applyToIframe();
  }, [dark, resolvedTheme]);

  return (
    <iframe
      ref={iframeRef}
      title="Financial Freedom Journey course outline"
      srcDoc={courseHtml}
      onLoad={applyToIframe}
      className={`fixed inset-0 h-full w-full border-0 ${dark ? "bg-[#0b161c]" : "bg-[#f4faf7]"}`}
    />
  );
}
