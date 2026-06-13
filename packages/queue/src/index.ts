import { Queue } from "bullmq";

function getConnectionOptions() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "6379", 10),
    maxRetriesPerRequest: null as null,
  };
}

export function getContentQueue() {
  return new Queue("content-generation", { connection: getConnectionOptions() });
}

export function getIndexQueue() {
  return new Queue("indexing", { connection: getConnectionOptions() });
}

export function getAutomationQueue() {
  return new Queue("automation", { connection: getConnectionOptions() });
}

export const QUEUE_NAMES = {
  content: "content-generation",
  indexing: "indexing",
  automation: "automation",
} as const;

export { getConnectionOptions };
