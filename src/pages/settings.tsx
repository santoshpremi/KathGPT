import { Button, Card, Divider, Input, Option, Select, Switch, Typography } from "@mui/joy";
import { useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useModals } from "../router";
import { exportData, importData } from "../lib/api/rust/workflows";
import { rustFetch } from "../lib/api/rust/client";
import { DEV_ORG_ID } from "../lib/local/seed";
import { useTranslation } from "../lib/i18n";
import {
  getQuickComposeShortcutLabel,
  isDesktopTauri,
  isQuickComposeEnabled,
  setQuickComposeEnabled,
} from "../lib/tauri/quickCompose";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { open } = useModals();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [locale, setLocale] = useState("en");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [quickComposeEnabled, setQuickComposeEnabledState] = useState(
    () => isQuickComposeEnabled(),
  );
  const showDesktopSettings = isDesktopTauri();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kathagpt-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text) as Record<string, unknown>;
      const result = await importData(snapshot);
      void queryClient.invalidateQueries();
      toast.success(
        `Imported ${result.chats} chats, ${result.messages} messages, ${result.workflows} workflows`,
      );
    } catch {
      toast.error("Import failed — check the backup file format");
    } finally {
      setImporting(false);
    }
  };

  const saveProfile = async () => {
    try {
      await rustFetch("/user/me", {
        method: "PATCH",
        body: JSON.stringify({ locale, defaultModel }),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 overflow-y-auto p-6">
      <Typography level="h2">{t("settings.title")}</Typography>

      <Card className="!p-6">
        <Typography level="title-lg" className="!mb-2">
          {t("profile", "Profile")}
        </Typography>
        <div className="mb-3 flex flex-col gap-2">
          <Typography level="body-sm">Language</Typography>
          <Select value={locale} onChange={(_e, v) => v && setLocale(v)}>
            <Option value="en">English</Option>
            <Option value="de">Deutsch</Option>
            <Option value="fr">Français</Option>
          </Select>
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <Typography level="body-sm">Default model</Typography>
          <Input
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          />
        </div>
        <Button onClick={() => void saveProfile()}>Save profile</Button>
      </Card>

      {showDesktopSettings && (
        <Card className="!p-6">
          <Typography level="title-lg" className="!mb-2">
            {t("settings.quickCompose.title")}
          </Typography>
          <Typography level="body-sm" className="!mb-4 text-gray-500">
            {t("settings.quickCompose.description")}
          </Typography>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Typography level="body-md">
                {t("settings.quickCompose.shortcut")}
              </Typography>
              <Typography level="body-sm" textColor="neutral.500">
                {getQuickComposeShortcutLabel()}
              </Typography>
            </div>
            <Switch
              checked={quickComposeEnabled}
              onChange={(event) => {
                const enabled = event.target.checked;
                setQuickComposeEnabledState(enabled);
                setQuickComposeEnabled(enabled);
                void invoke("sync_quick_compose_enabled", { enabled });
                toast.success(
                  enabled
                    ? t("settings.quickCompose.enabledHint")
                    : t("settings.quickCompose.disabledHint"),
                );
              }}
            />
          </div>
        </Card>
      )}

      <Card className="!p-6">
        <Typography level="title-lg" className="!mb-2">
          {t("apiKeys.title", "API Keys")}
        </Typography>
        <Typography level="body-sm" className="!mb-4 text-gray-500">
          Configure OpenRouter or direct provider keys for AI chat.
        </Typography>
        <Button variant="outlined" onClick={() => open("/apiKeys")}>
          {t("apiKeys.manage", "Manage API Keys")}
        </Button>
      </Card>

      <Card className="!p-6">
        <Typography level="title-lg" className="!mb-2">
          {t("dataBackup", "Data Backup")}
        </Typography>
        <Typography level="body-sm" className="!mb-4 text-gray-500">
          Export or restore chats, messages, and workflows.
        </Typography>
        <div className="flex flex-wrap gap-2">
          <Button loading={exporting} onClick={() => void handleExport()}>
            {t("exportBackup", "Export Backup")}
          </Button>
          <Button
            component="label"
            variant="outlined"
            loading={importing}
          >
            {t("importBackup", "Import Backup")}
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
          </Button>
        </div>
      </Card>

      <Divider />

      <Button
        variant="plain"
        color="neutral"
        onClick={() => {
          window.location.href = `/${DEV_ORG_ID}`;
        }}
      >
        {t("backToChat", "Back to Chat")}
      </Button>
    </div>
  );
}
