// app/coloring/[slug]/[image]/page.tsx
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ColoringImage from "../../FolderLogic";
export const dynamic = "force-dynamic";
function imageExists(slug: string, file: string) {
  const p = path.join(process.cwd(), "public", "images", slug, file);
  try { return fs.existsSync(p); } catch { return false; }
}
export default function ImagePage({ params }: { params: { slug: string; image: string } }) {
  const { slug } = params;
  const file = decodeURIComponent(params.image);
  if (!imageExists(slug, file)) return notFound();
  const imageSrc = `/images/${slug}/${file}`;
  return <ColoringImage title={file} imageSrc={imageSrc} />;
}
