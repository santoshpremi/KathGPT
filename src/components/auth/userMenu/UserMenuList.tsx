import { SettingsOutlined, Code, Memory } from "@mui/icons-material";
import { type ColorPaletteProp } from "@mui/joy/styles";
import { useApiKeysEnabled } from "../../../lib/api/localHooks";
import {
  type ModalPath,
  type Path,
  useModals,
  useNavigate,
  useParams,
} from "../../../router";
import { useTranslation } from "../../../lib/i18n";
import { Chip, ListDivider, Typography, MenuItem, Menu } from "@mui/joy";
import { LanguageSelector } from "../../settings/languageSelector";
import { type UserXP } from "../../../lib/api/gamification";
import { UserDisplay } from "./UserDisplay";

interface MenuItemInterface {
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  to?: Path;
  modalPath?: ModalPath;
  chipLabel?: string;
  color?: ColorPaletteProp;
  testId?: string;
  doesRender?: boolean;
}
interface MenuItemGroup {
  groupLabel?: string;
  items: MenuItemInterface[];
}

export function UserMenuList({
  userXPData,
  isAcademy,
  hasLanguageSelector = true,
  isMenuCompact,
}: {
  userXPData: UserXP;
  isAcademy?: boolean;
  hasLanguageSelector?: boolean;
  isMenuCompact?: boolean;
}) {
  const { t } = useTranslation();
  const modals = useModals();
  const navigate = useNavigate();
  const params = useParams("/:organizationId");

  const { data: apiKeysEnabled } = useApiKeysEnabled();

  const menuTitleStyle = "pl-3 pt-1.5 pb-0.5 tracking-wider !text-gray-500";

  const menuItems: MenuItemGroup[] = [
    {
      groupLabel: t("language").toUpperCase(),
      items: [
        {
          label: (
            <LanguageSelector
              sx={{ width: "100%" }}
              filter={isAcademy ? ["de", "en"] : undefined}
            />
          ),
          doesRender: !!hasLanguageSelector,
        },
      ],
    },
    {
      groupLabel: t("developer"),
      items: [
        {
          label: t("settings.apiKeys"),
          icon: <Code color="primary" />,
          doesRender: !!apiKeysEnabled,
          modalPath: "/apiKeys",
        },
        {
          label: t("settings.addLocalModel"),
          icon: <Memory color="primary" />,
          doesRender: true,
          modalPath: "/localModels",
        },
        {
          label: t("settings.title"),
          icon: <SettingsOutlined color="primary" />,
          doesRender: true,
          onClick: () => {
            window.location.href = "/settings";
          },
        },
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter((group) =>
    group.items.some((item: MenuItemInterface) => item.doesRender),
  );

  return (
    <Menu placement="bottom-end" className="!p-0 !text-sm">
      <div className="bg-blue-50 p-3 pr-[90px]">
        <UserDisplay isAcademy={isAcademy} userXPData={userXPData} />
      </div>
      <ListDivider sx={{ mt: 0 }} />
      {filteredMenuItems.map((group, index) => (
        <div
          key={"group-" + index}
          style={{
            marginBottom: index === filteredMenuItems.length - 1 ? 0 : "0.5rem",
          }}
        >
          {group.groupLabel && (
            <Typography level="body-xs" className={menuTitleStyle}>
              {group.groupLabel.toUpperCase()}
            </Typography>
          )}
          {group.items.map(
            (item, i) =>
              item.doesRender && (
                <MenuItem
                  key={"item-" + index + "-" + i}
                  data-testid={item.testId}
                  color={item.color}
                  onClick={async () => {
                    item.onClick?.();
                    item.modalPath && modals.open(item.modalPath, { params });
                    if (item.to) {
                      await navigate(item.to, { params });
                    }
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-7">
                    <div className="flex w-full items-center gap-2">
                      {item.icon}
                      {item.label}
                    </div>
                    {item.chipLabel && (
                      <Chip color="primary" size="sm">
                        {item.chipLabel}
                      </Chip>
                    )}
                  </div>
                </MenuItem>
              ),
          )}
        </div>
      ))}
      <ListDivider sx={{ mb: 0 }} className="!bg-gray-100" />
      <Typography level="body-xs" className="p-1" textAlign="center">
        KathaGPT Local Edition
      </Typography>
    </Menu>
  );
}
