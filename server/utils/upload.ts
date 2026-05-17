import crypto from "crypto";

// Dynamic import for aws-sdk (CommonJS module)
let S3: any = null;
async function getS3() {
  if (!S3) {
    const awsSdk = await import("aws-sdk");
    S3 = awsSdk.default?.S3 || awsSdk.S3;
  }
  return S3;
}

const USE_UPLOADTHING = !!process.env.UPLOADTHING_API_KEY;

export async function uploadToUploadThingOrS3(
  file: Express.Multer.File,
  opts: { folder?: string } = {}
): Promise<string> {
  if (USE_UPLOADTHING) {
    // Placeholder: integrate with UploadThing server SDK
    // For now, throw error to indicate it needs implementation
    throw new Error(
      "UploadThing server integration not implemented. Set S3 env vars or implement UploadThing SDK."
    );
  } else if (process.env.S3_BUCKET) {
    const S3Class = await getS3();
    const s3 = new S3Class({
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET,
      endpoint: process.env.S3_ENDPOINT,
      s3ForcePathStyle: true,
      region: process.env.AWS_REGION || "us-east-1",
    });

    const key = `${opts.folder || "uploads"}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${file.originalname}`;

    await s3
      .putObject({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    const url = process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
      : `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return url;
  }

  // Fallback: return a data URL for development (not recommended for production)
  if (process.env.NODE_ENV === "development") {
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
  }

  throw new Error("No upload provider configured. Set UPLOADTHING_API_KEY or S3_* env vars.");
}

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

