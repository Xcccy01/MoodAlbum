import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/base.css";
import "./styles/auth.css";
import "./styles/member.css";
import "./styles/care.css";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
