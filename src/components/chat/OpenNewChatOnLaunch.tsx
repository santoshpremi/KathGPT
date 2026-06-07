import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useDraftChat } from "../../lib/hooks/useDraftChat";

const SESSION_KEY = "kathgpt-session-started";

function shouldSkipLaunchRedirect(pathname: string) {
  return (
    pathname.includes("/onboarding") || pathname.includes("/auth")
  );
}

/** Once per app session, land on a fresh compose screen instead of the last chat. */
export function OpenNewChatOnLaunch() {
  const location = useLocation();
  const { openDraftChat } = useDraftChat();
  const started = useRef(false);

  useEffect(() => {
    if (shouldSkipLaunchRedirect(location.pathname)) return;
    if (started.current || sessionStorage.getItem(SESSION_KEY)) return;
    started.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");
    void openDraftChat();
  }, [location.pathname, openDraftChat]);

  return null;
}
