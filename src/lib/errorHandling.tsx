// src/lib/errorHandling.tsx
import type { AxiosError } from "axios";
import i18n from "i18next";
import { toast } from "react-toastify";
import { ErrorToastContent } from "../components/util/ErrorToastContent";
import { RustApiError } from "./api/rust/client";

export let shownNoInternetError = false;

type Extra = {
  [key: string]: unknown;
};

export function handleGenericError(
  error: Error,
  customMessage: string | undefined,
  _p0: { source: string },
  propagate: boolean = false,
) {
  console.error("Error:", error);
  showErrorToast(customMessage, error);
  if (propagate) {
    throw error;
  }
}


export function genericErrorHandlerFactory(customMessage: string | undefined) {
  return (error: Error) => {
    handleGenericError(error, customMessage, { source: "unknown" });
  };
}

export function handleAxiosError(
  err: AxiosError,
  setLoggedIn: (loggedIn: boolean) => void,
  t: (key: string) => string,
  disableErrorToast: boolean = false,
) {
  if (err.response?.status === 401) {
    setLoggedIn(false);
  } else {
    if (!err.response) {
      if (!shownNoInternetError) {
        const id = toast.error(t("noInternet"), {
          autoClose: false,
        });
        toast.onChange((notification) => {
          if (notification.id === id) {
            if (notification.status === "removed") {
              shownNoInternetError = false;
            }
          }
        });
        shownNoInternetError = true;
      }
      return;
    }
    if(disableErrorToast) {
      showErrorToast("errors.network");

    }
    throw err;
  }
}

function showErrorToast(
  customMessage: string | undefined,
  error?: Error,
) {
  const base = customMessage
    ? i18n.t(customMessage)
    : i18n.t("errors.unknown");
  const detail =
    error instanceof RustApiError && error.message
      ? error.message
      : error?.message && error.message !== base
        ? error.message
        : null;
  const text = detail ? `${base} ${detail}` : base;

  toast.error(text, {
    autoClose: import.meta.env.DEV ? 5000 : 8000,
    closeOnClick: true,
    draggable: false,
  });
}

// format: C-XXXX (C for client)
// this is to make the error id more user friendly and to make it easier to match the client side error with the server side error
function generateClientErrorCode() {
  return `C-${Math.random().toString(36).substring(7, 11)}`.toUpperCase();
}
