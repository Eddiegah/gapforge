import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, priority: 1.0 },
    { url: `${BASE_URL}/demo`, priority: 0.9 },
    { url: `${BASE_URL}/pricing`, priority: 0.9 },
    { url: `${BASE_URL}/login`, priority: 0.8 },
    { url: `${BASE_URL}/question-bank`, priority: 0.8 },
    { url: `${BASE_URL}/gap-ai`, priority: 0.8 },
    { url: `${BASE_URL}/gap-drops`, priority: 0.7 },
    { url: `${BASE_URL}/gap-simplify`, priority: 0.7 },
    { url: `${BASE_URL}/paper-writer`, priority: 0.7 },
    { url: `${BASE_URL}/grant-writer`, priority: 0.7 },
    { url: `${BASE_URL}/peer-review`, priority: 0.7 },
    { url: `${BASE_URL}/paper-summarizer`, priority: 0.7 },
    { url: `${BASE_URL}/conference-finder`, priority: 0.6 },
    { url: `${BASE_URL}/research-questions`, priority: 0.6 },
    { url: `${BASE_URL}/abstract-writer`, priority: 0.6 },
    { url: `${BASE_URL}/gap-radar`, priority: 0.6 },
    { url: `${BASE_URL}/literature-map`, priority: 0.6 },
    { url: `${BASE_URL}/citation-graph`, priority: 0.6 },
    { url: `${BASE_URL}/leaderboard`, priority: 0.5 },
    { url: `${BASE_URL}/trending`, priority: 0.5 },
    { url: `${BASE_URL}/digest`, priority: 0.5 },
    { url: `${BASE_URL}/docs`, priority: 0.5 },
    { url: `${BASE_URL}/status`, priority: 0.4 },
    { url: `${BASE_URL}/privacy`, priority: 0.3 },
    { url: `${BASE_URL}/terms`, priority: 0.3 },
  ];

  return staticPages.map(({ url, priority }) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));
}
