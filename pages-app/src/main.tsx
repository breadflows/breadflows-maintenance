import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RouterProvider } from "./routing";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <RouterProvider>
    <App />
  </RouterProvider>,
);
