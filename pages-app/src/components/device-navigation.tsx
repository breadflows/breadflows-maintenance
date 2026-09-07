"use client";
import { useEffect } from "react";
import { usePathname } from "@/routing";
import { directionalTarget } from "@/lib/directional-focus";
const selector =
  'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),iframe[title],[tabindex="0"]';
function focusable(scope: Pick<ParentNode, "querySelectorAll">) {
  return Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.closest('[inert],[aria-hidden="true"]') &&
      el.getClientRects().length &&
      getComputedStyle(el).visibility !== "hidden",
  );
}
export function DeviceNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (
      /SmartTV|Smart-TV|Tizen|Web0S|WebOS|HbbTV|NetCast|Viera|BRAVIA|AFT[A-Z]/i.test(
        navigator.userAgent,
      )
    )
      root.dataset.device = "tv";
    const pointer = (e: PointerEvent) => {
      root.dataset.input = e.pointerType === "touch" ? "touch" : "pointer";
    };
    const keydown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        active?.matches('input,textarea,select,[contenteditable="true"]') ||
        active?.closest('[role="slider"],[role="combobox"],[role="listbox"],[role="menu"]')
      )
        return;
      if (
        ["Escape", "BrowserBack", "GoBack"].includes(e.key) &&
        !active?.closest('[role="dialog"]')
      ) {
        const back = document.querySelector<HTMLButtonElement>("[data-player-back]");
        if (back) {
          e.preventDefault();
          back.click();
        }
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      root.dataset.input = "remote";
      const scope = active?.closest('[role="dialog"],dialog') || document;
      const options = focusable(scope).filter((el) => el !== active);
      if (!options.length) return;
      let next: HTMLElement | undefined;
      if (!active || active === document.body) next = options[0];
      else {
        const index = directionalTarget(
          active.getBoundingClientRect(),
          options.map((el) => el.getBoundingClientRect()),
          e.key,
        );
        next = options[index];
      }
      if (next) {
        e.preventDefault();
        e.stopPropagation();
        next.focus({ preventScroll: true });
        next.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", keydown, true);
    };
  }, []);
  useEffect(() => {
    if (
      document.documentElement.dataset.input !== "remote" &&
      document.documentElement.dataset.device !== "tv"
    )
      return;
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      const first = focusable(main || document)[0];
      first?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
