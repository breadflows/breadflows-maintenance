import { useEffect } from "react";
import { AppShell } from "./components/app-shell";
import { BreadFlows } from "./components/breadflows";
import { Screens } from "./components/screens";
import { usePathname } from "./routing";
import { pageMetadata } from "./lib/pages";
export function App() {
  const path = usePathname();
  useEffect(() => {
    const meta = pageMetadata(path);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", "https://breadflows.com" + (path === "/" ? "/" : path + "/"));
  }, [path]);
  return <AppShell>{path === "/" ? <BreadFlows /> : <Screens />}</AppShell>;
}
