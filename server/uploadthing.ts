import { createUploadthing, type FileRouter } from "uploadthing/express";
import { z } from "zod";

const f = createUploadthing();

export const uploadRouter = {
  driverProfilePhoto: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { fileUrl: file.url, driverId: metadata.driverId };
    }),

  driverLicense: f({
    image: { maxFileSize: "4MB", maxFileCount: 2 },
  })
    .input(z.object({ driverId: z.string(), side: z.enum(["front", "back"]) }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { fileUrl: file.url, driverId: metadata.driverId, side: metadata.side };
    }),

  vehiclePhotos: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
  })
    .input(z.object({ driverId: z.string(), photoType: z.enum(["front", "side", "back", "plate"]) }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { fileUrl: file.url, driverId: metadata.driverId, photoType: metadata.photoType };
    }),

  insuranceDocument: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { fileUrl: file.url, driverId: metadata.driverId };
    }),

  backgroundCheckDocument: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      return { fileUrl: file.url, driverId: metadata.driverId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
