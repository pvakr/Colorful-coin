// app/coloring/[slug]/[image]/page.tsx
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ColoringImage from "../../FolderLogic";

export const dynamic = "force-dynamic";

function imageExists(slug: string, file: string) {
  const p = path.join(process.cwd(), "public", "images", slug, file);
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

type PageProps = {
  params: Promise<{
    slug: string;
    image: string;
  }>;
};

export default async function ImagePage({ params }: PageProps) {
  const { slug, image } = await params; // ✅ REQUIRED

  const file = decodeURIComponent(image);

  if (!imageExists(slug, file)) {
    notFound();
  }

  const imageSrc = `/images/${slug}/${file}`;

  return <ColoringImage title={file} imageSrc={imageSrc} />;
}
