import { ApiDocumentHeader } from "../../../packages/apiTypes/src/Documents";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { rustFetch } from "./rust/client";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Could not encode file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function useUploadDocument() {
  const { t } = useTranslation();

  return async (file: File) => {
    if (file.size > 524_288_000) {
      toast.error(t("errors.fileTooLarge", { size: 500 }));
      throw new Error("File too large");
    }

    const data = await fileToBase64(file);
    const uploaded = await rustFetch<ApiDocumentHeader>("/documents/upload", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        data,
        mimeType: file.type || undefined,
        size: file.size,
      }),
    });

    return ApiDocumentHeader.parse({
      ...uploaded,
      createdAt: uploaded.createdAt ?? new Date().toISOString(),
    });
  };
}

export function useUploadDocumentWithToast() {
  const uploadDocument = useUploadDocument();
  const { t } = useTranslation();

  return async (file: File) => {
    return toast.promise(uploadDocument(file), {
      pending: t("documents.uploading", "Uploading…"),
      success: t("documents.uploaded", "File attached"),
      error: t("documents.error"),
    });
  };
}

export function useDocumentHeader(documentId: string) {
  const { data } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const header = await rustFetch<ApiDocumentHeader>(
        `/documents/${documentId}/header`,
      );
      return ApiDocumentHeader.parse({
        ...header,
        createdAt: header.createdAt ?? new Date().toISOString(),
      });
    },
    enabled: Boolean(documentId),
    staleTime: 60_000,
  });

  return data;
}
