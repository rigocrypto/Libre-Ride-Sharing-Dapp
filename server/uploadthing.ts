import { createUploadthing, type FileRouter } from "uploadthing/express";
import { z } from "zod";

const f = createUploadthing();

export const uploadRouter = {
  driverProfilePhoto: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const meta = metadata as any;
      return { fileUrl: file.url, driverId: meta.driverId };
    }),

  driverLicense: f({
    image: { maxFileSize: "4MB", maxFileCount: 2 },
  })
    .input(z.object({ driverId: z.string(), side: z.enum(["front", "back"]) }))
    .onUploadComplete(async ({ metadata, file }) => {
      const meta = metadata as any;
      return { fileUrl: file.url, driverId: meta.driverId, side: meta.side }; 
    }),

  vehiclePhotos: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
  })
    .input(z.object({ driverId: z.string(), photoType: z.enum(["front", "side", "back", "plate"]) }))
    .onUploadComplete(async ({ metadata, file }) => {
      const meta = metadata as any;
      return { fileUrl: file.url, driverId: meta.driverId, photoType: meta.photoType }; 
    }),

  insuranceDocument: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const meta = metadata as any;
      return { fileUrl: file.url, driverId: meta.driverId };
    }),

  backgroundCheckDocument: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ driverId: z.string() }))
    .onUploadComplete(async ({ metadata, file }) => {
      const meta = metadata as any;
      return { fileUrl: file.url, driverId: meta.driverId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
