import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = appUrl().replace(/\/$/, "");
  return [{ url: siteUrl, changeFrequency: "hourly", priority: 1 }];
}
