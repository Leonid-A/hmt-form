import { MongoClient } from "mongodb";
import { getServerConfig } from "@/config/server";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Next.js dev-ում HMR-ի պատճառով կապերը չեն բազմապատկվում global cache-ի շնորհիվ։
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const { mongodb } = getServerConfig();

  if (!global._mongoClientPromise) {
    const client = new MongoClient(mongodb.uri);
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}
