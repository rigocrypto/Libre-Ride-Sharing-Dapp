import { IStorage } from "./storage";
import { MemStorage } from "./storage";
import { DrizzleStorage } from "./storage/DrizzleStorage";

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  const engine = process.env.STORAGE_ENGINE;
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  // Use DrizzleStorage if explicitly requested, or by default when DATABASE_URL is set.
  if (engine === "drizzle" || (!engine && hasDatabaseUrl)) {
    try {
      storageInstance = new DrizzleStorage();
      console.log("[storage] ✅ Using DrizzleStorage (PostgreSQL)");
      return storageInstance;
    } catch (error: any) {
      console.warn("[storage] Failed to initialize DrizzleStorage:", error.message);
      console.warn("[storage] Falling back to MemStorage");
      storageInstance = new MemStorage();
      return storageInstance;
    }
  }

  // Default to MemStorage for development and deterministic tests.
  storageInstance = new MemStorage();
  console.log("[storage] Using MemStorage (in-memory)");
  return storageInstance;
}

export const storage = getStorage();
