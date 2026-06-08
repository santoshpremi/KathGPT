import { Routes } from "@generouted/react-router/lazy";
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ApiProvider } from "./lib/api/ApiProvider";
import { initRustApiClient, isTauriApp } from "./lib/api/rust/init";
import { loadI18n } from "./lib/i18n";

function showBootScreen(root: HTMLElement, message: string) {
  root.innerHTML = `
    <div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fff;">
      <div style="text-align:center;">
        <div style="width:32px;height:32px;border:3px solid #e5e5e5;border-top-color:#0d0d0d;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div>
        <p style="color:#6e6e80;margin:0;font-size:0.9375rem;">${message}</p>
      </div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
}

async function initializeApp() {
  const root = document.getElementById("root");
  if (!root) return;

  showBootScreen(root, "Starting KathaGPT…");

  try {
    await initRustApiClient();
    await loadI18n();
    root.innerHTML = "";
    initReact(root);
  } catch (err) {
    console.error("Failed to initialize app:", err);
    const hint = isTauriApp()
      ? "Quit any other KathaGPT or dev server, then reopen the app."
      : "Make sure the local API is running (pnpm run dev).";
    root.innerHTML = `
      <div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:2rem;text-align:center;">
        <div>
          <h2 style="margin:0 0 0.5rem">KathaGPT could not start</h2>
          <p style="color:#666;margin:0 0 1rem">${hint}</p>
          <p style="color:#999;font-size:0.875rem;margin:0">${String(err)}</p>
        </div>
      </div>`;
  }
}

function initReact(root: HTMLElement) {
  ReactDOM.createRoot(root).render(
    <ApiProvider>
      <Routes />
    </ApiProvider>,
  );
}

initializeApp();
