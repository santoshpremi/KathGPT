// src/pages/[organizationId]/index.tsx
import { DelayedLoader } from "../../components/util/DelayedLoader";

/** Org home — OpenNewChatOnLaunch in _layout navigates to a fresh draft chat. */
export default function OrganizationHomePage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <DelayedLoader />
    </div>
  );
}
