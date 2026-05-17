import React, { useState } from "react";
import { useUploader } from "@/lib/uploads/useUploader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  endpoint: string; // e.g. /api/upload/license
  entityIdKey: string; // driverId or userId
  entityId: string;
  label?: string;
  photoType?: string;
  accept?: string;
  onUploaded?: (url: string, id: string) => void;
};

export default function UploadDocument({
  endpoint,
  entityIdKey,
  entityId,
  label = "Upload Document",
  photoType,
  accept = "image/*,application/pdf",
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { uploadFile, loading, error } = useUploader();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    try {
      const extra: Record<string, string> = {};
      if (photoType) extra.photoType = photoType;

      const result = await uploadFile(endpoint, entityIdKey, entityId, file, extra);
      setUploadedUrl(result.url);
      onUploaded?.(result.url, result.id);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={loading || !!uploadedUrl}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          <Progress value={50} className="w-full" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedUrl && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Upload successful!{" "}
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline">
              View file
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={!file || loading || !!uploadedUrl} className="w-full">
        <Upload className="w-4 h-4 mr-2" />
        {loading ? "Uploading..." : uploadedUrl ? "Uploaded" : "Upload"}
      </Button>
    </form>
  );
}


