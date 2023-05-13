import React from "react";
import ReactDOM from "react-dom/client";
import { Frontend } from "./frontend";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Frontend />
  </React.StrictMode>
);
