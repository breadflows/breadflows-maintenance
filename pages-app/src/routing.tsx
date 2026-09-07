import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
const InitialUrl = createContext("/");
export function RouterProvider({ url = "/", children }: { url?: string; children: ReactNode }) {
  return <InitialUrl.Provider value={url}>{children}</InitialUrl.Provider>;
}
const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
function useUrl() {
  const initial = useContext(InitialUrl);
  return useSyncExternalStore(
    subscribe,
    () => location.pathname + location.search,
    () => initial,
  );
}
export const usePathname = () =>
  new URL(useUrl(), "https://breadflows.com").pathname.replace(/\/$/, "") || "/";
export const useSearchParams = () => new URL(useUrl(), "https://breadflows.com").searchParams;
export function navigate(href: string, replace = false) {
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) {
    location.assign(url.href);
    return;
  }
  history[replace ? "replaceState" : "pushState"]({}, "", url.pathname + url.search + url.hash);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (url.hash)
    requestAnimationFrame(() =>
      document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView(),
    );
  else window.scrollTo({ top: 0, behavior: "instant" });
}
const router = {
  push: (url: string) => navigate(url),
  replace: (url: string) => navigate(url, true),
  back: () => history.back(),
};
export const useRouter = () => router;
