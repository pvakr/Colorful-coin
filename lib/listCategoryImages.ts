// lib/listCategoryImages.ts
import fs from "fs";
import path from "path";

/**
 * Returns a public URL array of images in /public/images/<slug>/* (sorted naturally).
 */
export function listCategoryImages(slug: string): string[] {
  const dir = path.join(process.cwd(), "public", "images", slug);
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|svg)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } catch {
    files = [];
  }
  return files.map((f) => `/images/${slug}/${f}`);
}
