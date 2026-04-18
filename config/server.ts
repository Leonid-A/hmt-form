import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI պարտադիր է"),
  MONGODB_DB: z.string().min(1).default("hmt_form"),
  MONGODB_COLLECTION: z.string().min(1).default("submissions"),
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
 * Սերվերային կոնֆիգ՝ կարդում է միայն process.env-ը (գաղտնիքները՝ .env.local / host env)։
 * Կանչել միայն սերվերային կոդից (Server Actions, Route Handlers, lib/mongodb)։
 */
export function getServerConfig(): ServerConfig {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    MONGODB_COLLECTION: process.env.MONGODB_COLLECTION,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Սերվերի միջավայրի սխալ: ${msg}`);
  }

  const data = parsed.data;
  cached = {
    mongodb: {
      uri: data.MONGODB_URI,
      dbName: data.MONGODB_DB,
      collectionName: data.MONGODB_COLLECTION,
    },
  };
  return cached;
}
