import { z } from "zod";

/** Կոդում ֆիքսված՝ փոխելու դեպքում խմբագրեք այստեղ (URI-ում db path չի օգտագործվում)։ */
export const MONGODB_DB_NAME = "hmt_form";
export const MONGODB_COLLECTION_NAME = "submissions";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI պարտադիր է"),
});

export type ServerConfig = {
  mongodb: {
    uri: string;
    dbName: string;
    collectionName: string;
  };
};

let cached: ServerConfig | null = null;

/**
 * Սերվերային կոնֆիգ՝ env-ից միայն `MONGODB_URI`։ DB և collection՝ `MONGODB_DB_NAME` / `MONGODB_COLLECTION_NAME`։
 */
export function getServerConfig(): ServerConfig {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Սերվերի միջավայրի սխալ: ${msg}`);
  }

  cached = {
    mongodb: {
      uri: parsed.data.MONGODB_URI,
      dbName: MONGODB_DB_NAME,
      collectionName: MONGODB_COLLECTION_NAME,
    },
  };
  return cached;
}
