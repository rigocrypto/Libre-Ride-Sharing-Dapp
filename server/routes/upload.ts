import express from "express";
import multer from "multer";
import { storage } from "../storage-factory.js";
import { uploadToUploadThingOrS3, sha256 } from "../utils/upload";
import { db } from "../db/client";
import { driverPhotos } from "../../shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB
});

const router = express.Router();

// Upload driver license photo
router.post("/api/upload/license", upload.single("file"), async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!req.file || !driverId) {
      return res.status(400).json({ error: "missing driverId or file" });
    }

    const hash = sha256(req.file.buffer);
    const url = await uploadToUploadThingOrS3(req.file, {
      folder: `drivers/${driverId}/license`,
    });

    const [inserted] = await db
      .insert(driverPhotos)
      .values({
        driverId,
        photoType: "license_front",
        photoUrl: url,
        photoHash: hash,
        verificationStatus: "pending",
      })
      .returning();

    res.json({ ok: true, id: inserted.id, url });
  } catch (e: any) {
    console.error("[upload/license]", e);
    res.status(500).json({ error: e.message || "upload_failed" });
  }
});

// Upload vehicle photo
router.post("/api/upload/vehicle", upload.single("file"), async (req, res) => {
  try {
    const { driverId, photoType } = req.body;
    if (!req.file || !driverId) {
      return res.status(400).json({ error: "missing driverId or file" });
    }

    const hash = sha256(req.file.buffer);
    const url = await uploadToUploadThingOrS3(req.file, {
      folder: `drivers/${driverId}/vehicle`,
    });

    // Store in storage (MemStorage or Drizzle)
    // TODO: Add photo storage methods to storage interface
    res.json({ ok: true, id: driverId, url, hash, photoType: photoType || "vehicle_front" });
  } catch (e: any) {
    console.error("[upload/vehicle]", e);
    res.status(500).json({ error: e.message || "upload_failed" });
  }
});

// Upload insurance document
router.post("/api/upload/insurance", upload.single("file"), async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!req.file || !driverId) {
      return res.status(400).json({ error: "missing driverId or file" });
    }

    const hash = sha256(req.file.buffer);
    const url = await uploadToUploadThingOrS3(req.file, {
      folder: `drivers/${driverId}/insurance`,
    });

    // Store in storage (MemStorage or Drizzle)
    // TODO: Add photo storage methods to storage interface
    res.json({ ok: true, id: driverId, url, hash });
  } catch (e: any) {
    console.error("[upload/insurance]", e);
    res.status(500).json({ error: e.message || "upload_failed" });
  }
});

// Upload rider profile photo
router.post("/api/upload/profile-photo", upload.single("file"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file || !userId) {
      return res.status(400).json({ error: "missing userId or file" });
    }

    const hash = sha256(req.file.buffer);
    const url = await uploadToUploadThingOrS3(req.file, {
      folder: `users/${userId}/profile`,
    });

    // Store in storage (MemStorage or Drizzle)
    // TODO: Add photo storage methods to storage interface
    res.json({ ok: true, id: userId, url, hash });
  } catch (e: any) {
    console.error("[upload/profile-photo]", e);
    res.status(500).json({ error: e.message || "upload_failed" });
  }
});

export default router;


