import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });
config();

function directUrl(schema: string) {
  const url = new URL(env("DIRECT_URL"));
  if (!url.searchParams.has("schema")) url.searchParams.set("schema", schema);
  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: directUrl("balnotes") },
});
