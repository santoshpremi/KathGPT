import { useEffect, useState } from "react";
import { useNavigate } from "../router";
import { useTranslation } from "../lib/i18n";
import { Typography, CircularProgress, Button } from "@mui/joy";
import { rustFetch } from "../lib/api/rust/client";
import { DEV_ORG_ID } from "../lib/local/seed";

interface ProviderKeyStatus {
  id: string;
  configured: boolean;
}

export default function IndexPage() {
  return <OrganizationRedirect />;
}

function OrganizationRedirect() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, 20_000);

    async function redirect() {
      try {
        const keys = await rustFetch<ProviderKeyStatus[]>("/provider-keys/status");
        clearTimeout(timer);
        const hasKey = keys.some((k) => k.configured);
        const onboarded = localStorage.getItem("kathagpt_onboarded") === "true";

        if (!cancelled) {
          if (!hasKey && !onboarded) {
            window.location.replace("/onboarding");
          } else {
            void navigate("/:organizationId", {
              params: { organizationId: DEV_ORG_ID },
              replace: true,
            });
          }
        }
      } catch {
        clearTimeout(timer);
        if (!cancelled) {
          void navigate("/:organizationId", {
            params: { organizationId: DEV_ORG_ID },
            replace: true,
          });
        }
      }
    }

    void redirect();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  if (timedOut) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center p-8">
          <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-lg font-semibold text-stone-900">
            {t("startupFailed", "KathaGPT could not start")}
          </p>
          <p className="text-sm text-stone-500">
            {t("startupFailedDesc", "The local API backend didn't respond in time. Quit the app completely and reopen it.")}
          </p>
          <Button
            variant="outlined"
            color="neutral"
            onClick={() => window.location.reload()}
          >
            {t("retry", "Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <CircularProgress size="md" />
        <Typography level="body-lg" textColor="neutral.600">
          {t("loading", "Loading KathaGPT…")}
        </Typography>
      </div>
    </div>
  );
}
