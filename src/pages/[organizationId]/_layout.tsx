import { CssVarsProvider } from "@mui/joy";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { OfflineBanner } from "../../components/util/OfflineBanner";
import { Sidebar } from "../../components/sidebar/Sidebar";
import { NotFound } from "../../components/util/NotFound";
import { usePartOfCurrentOrganization } from "../../lib/api/organization";
import { useOrganizationQuery } from "../../lib/api/localHooks";
import useBreakingPoint from "../../lib/hooks/useBreakpoint";
import { useTheme } from "../../lib/hooks/useTheme";
import usePersistentState from "../../lib/hooks/usePersistentState";
import { OrganizationProvider } from "../../context/organization";
import { OpenNewChatOnLaunch } from "../../components/chat/OpenNewChatOnLaunch";

export default function OrganizationLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = usePersistentState<boolean>(
    "sidebar-state",
    true,
  );

  const isSmallScreen = useBreakingPoint("lg");

  useEffect(() => {
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSmallScreen]);

  usePartOfCurrentOrganization();

  const { data: organization, isLoading: isLoadingOrganization } =
    useOrganizationQuery();

  useEffect(() => {
    document.title = organization?.customTitle ?? "KathGPT";
  }, [organization?.customTitle]);

  const theme = useTheme();

  if (isLoadingOrganization) {
    return null;
  }

  if (!organization) {
    return <NotFound />;
  }

  return (
    <OrganizationProvider>
      <CssVarsProvider theme={theme}>
        <OpenNewChatOnLaunch />
        <div className="relative flex h-screen w-screen min-w-0 flex-row overflow-hidden">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <OfflineBanner />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </div>
      </CssVarsProvider>
    </OrganizationProvider>
  );
}
