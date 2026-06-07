"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Top-of-page progress bar that lights up on internal link clicks.
// Pure CSS animation — no JS measurement, just a smooth indeterminate fill.
export default function NavProgress() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  // navigation finished
  useEffect(() => {
    setBusy(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      if (href.startsWith("#")) return;
      if (href === pathname) return;
      setBusy(true);
    }
    function onForm() {
      setBusy(true);
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onForm, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onForm, true);
    };
  }, [pathname]);

  if (!busy) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
      <div className="page-progress-bar h-full bg-gradient-to-r from-brand via-fuchsia-400 to-brand-light" />
    </div>
  );
}
