import { renderToString } from "react-dom/server";
import { RouterProvider } from "./routing";
import { App } from "./App";
export { pages, pageMetadata } from "./lib/pages";
export function render(url: string) {
  return renderToString(
    <RouterProvider url={url}>
      <App />
    </RouterProvider>,
  );
}
