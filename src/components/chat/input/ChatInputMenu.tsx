import {
  AttachFile,
  AutoFixHigh,
  ChevronRight,
  HubOutlined,
  ImageOutlined,
  LanguageOutlined,
  MenuBookOutlined,
  SlideshowOutlined,
  StorageOutlined,
  TableChartOutlined,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
  Dropdown,
  IconButton,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import { toast } from "react-toastify";
import { useTranslation } from "../../../lib/i18n";
import { useNavigate, useModals } from "../../../router";
import { useCurrentOrganizationId } from "../../../lib/api/useCurrentOrganizationId";
import { TOOL_PATHS } from "../../../lib/hooks/toolPaths";

interface ChatInputMenuProps {
  fileUploadEnabled: boolean;
  ragEnabled: boolean;
  imageGenerationEnabled: boolean;
  onUploadFiles: () => void;
  onUploadFolder?: () => void;
  onOpenSources: () => void;
  onInsertPrompt: (prompt: string) => void;
}

export function ChatInputMenu({
  fileUploadEnabled,
  ragEnabled,
  imageGenerationEnabled,
  onUploadFiles,
  onUploadFolder,
  onOpenSources,
  onInsertPrompt,
}: ChatInputMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modals = useModals();
  const organizationId = useCurrentOrganizationId();
  const comingSoon = () => {
    toast.info(t("chat.inputMenu.comingSoon"));
  };

  return (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{
          root: {
            variant: "plain",
            color: "neutral",
            size: "sm",
            sx: { borderRadius: "10px" },
          },
        }}
      >
        <AddIcon fontSize="small" />
      </MenuButton>
      <Menu
        placement="top-start"
        sx={{
          minWidth: 260,
          py: 0.5,
          "--ListItemDecorator-size": "28px",
        }}
      >
        <MenuItem
          disabled={!fileUploadEnabled}
          onClick={() => {
            if (fileUploadEnabled) onUploadFiles();
          }}
        >
          <ListItemDecorator>
            <AttachFile fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.uploadFiles")}
        </MenuItem>

        {onUploadFolder && (
          <MenuItem
            disabled={!fileUploadEnabled}
            onClick={() => {
              if (fileUploadEnabled) onUploadFolder();
            }}
          >
            <ListItemDecorator>
              <AttachFile fontSize="small" />
            </ListItemDecorator>
            {t("chat.inputMenu.uploadFolder", "Upload folder")}
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            void navigate("/:organizationId/prompt-library", {
              params: { organizationId },
            });
          }}
        >
          <ListItemDecorator>
            <MenuBookOutlined fontSize="small" />
          </ListItemDecorator>
          {t("promptLibrary.nav")}
          <ChevronRight sx={{ ml: "auto", fontSize: 18, opacity: 0.5 }} />
        </MenuItem>

        {ragEnabled && (
          <MenuItem onClick={onOpenSources}>
            <ListItemDecorator>
              <StorageOutlined fontSize="small" />
            </ListItemDecorator>
            {t("chat.inputMenu.knowledgeBase")}
          </MenuItem>
        )}

        <ListDivider />

        <MenuItem
          onClick={() => {
            void navigate(TOOL_PATHS.researchAssistant, {
              params: { organizationId },
            });
          }}
        >
          <ListItemDecorator>
            <LanguageOutlined fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.webSearch")}
        </MenuItem>

        <MenuItem onClick={comingSoon}>
          <ListItemDecorator>
            <SlideshowOutlined fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.slides")}
          <ChevronRight sx={{ ml: "auto", fontSize: 18, opacity: 0.5 }} />
        </MenuItem>

        <MenuItem
          disabled={!imageGenerationEnabled}
          onClick={() => {
            if (imageGenerationEnabled) {
              void navigate("/:organizationId/tools/imageFactory", {
                params: { organizationId },
              });
            }
          }}
        >
          <ListItemDecorator>
            <ImageOutlined fontSize="small" />
          </ListItemDecorator>
          {t("generateImage")}
        </MenuItem>

        <MenuItem
          onClick={() =>
            onInsertPrompt(t("chat.inputMenu.tablesPrompt"))
          }
        >
          <ListItemDecorator>
            <TableChartOutlined fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.tables")}
        </MenuItem>

        <MenuItem
          onClick={() =>
            onInsertPrompt(t("chat.inputMenu.artifactPrompt"))
          }
        >
          <ListItemDecorator>
            <AutoFixHigh fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.artifactMode")}
          <ChevronRight sx={{ ml: "auto", fontSize: 18, opacity: 0.5 }} />
        </MenuItem>

        <ListDivider />

        <MenuItem
          onClick={() => {
            modals.open("/apiKeys");
          }}
        >
          <ListItemDecorator>
            <HubOutlined fontSize="small" />
          </ListItemDecorator>
          {t("chat.inputMenu.addConnectors")}
        </MenuItem>

        <Typography
          level="body-xs"
          sx={{ px: 2, py: 1, color: "neutral.500" }}
        >
          {t("chat.inputMenu.hint")}
        </Typography>
      </Menu>
    </Dropdown>
  );
}
