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

  if (import.meta.env.DEV) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches?.keys?.())
        .then((keys) => Promise.all((keys || []).map((key) => caches.delete(key))))
        .catch(() => undefined);
    });
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
