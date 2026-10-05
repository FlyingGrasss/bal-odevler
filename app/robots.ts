import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = appUrl().replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/login", "/admin"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
