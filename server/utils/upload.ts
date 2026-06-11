import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;
function getS3() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_KEY ?? "",
        secretAccessKey: process.env.S3_SECRET ?? "",
      },
      ...(process.env.S3_ENDPOINT ? {
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
      } : {}),
    });
  }
  return s3Client;
}

const USE_UPLOADTHING = !!process.env.UPLOADTHING_API_KEY;

export async function uploadToUploadThingOrS3(
  file: Express.Multer.File,
  opts: { folder?: string } = {}
): Promise<string> {
  if (USE_UPLOADTHING) {
    throw new Error(
      "UploadThing server integration not implemented. Set S3 env vars or implement UploadThing SDK."
    );
  } else if (process.env.S3_BUCKET) {
    const s3 = getS3();
    const key = `${opts.folder || "uploads"}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
      : `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com/${key}`;
    return url;
  }

  if (process.env.NODE_ENV === "development") {
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
  }

  throw new Error("No upload provider configured. Set UPLOADTHING_API_KEY or S3_* env vars.");
}

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
