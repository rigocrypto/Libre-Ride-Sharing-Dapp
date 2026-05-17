import { useState } from "react";

export function useUploader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(
    endpoint: string,
    entityIdKey: string,
    entityId: string,
    file: File,
    extra?: Record<string, string>
  ) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(entityIdKey, entityId);
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => formData.append(k, v));
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "upload_failed");
      }

      setLoading(false);
      return json;
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
      throw e;
    }
  }

  return { uploadFile, loading, error };
}


