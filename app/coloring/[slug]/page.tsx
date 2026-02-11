// app/coloring/[slug]/page.tsx
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
function listCategorySlugs() {
  const root = path.join(process.cwd(), "public", "images");
  try { return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { return []; }
}
function listImages(slug: string) {
  const dir = path.join(process.cwd(), "public", "images", slug);
  try { return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).filter((n) => /\.(png|jpe?g|webp|gif|svg)$/i.test(n)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })); } catch { return []; }
}
export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const cats = listCategorySlugs();
  if (!cats.includes(slug)) return notFound();
  const files = listImages(slug);
  const title = slug.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <span className="text-sm text-gray-500">{files.length} pages</span>
        </div>
        {files.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-600">
            No images found in <code>/public/images/{slug}/</code>.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fname) => {
              const src = `/images/${slug}/${fname}`;
              const link = `/coloring/${slug}/${encodeURIComponent(fname)}`;
              return (
                <Link key={fname} href={link} className="rounded-xl border bg-white p-2 shadow hover:shadow-md transition block">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-gray-50 flex items-center justify-center">
                    <img src={src} alt={fname} className="h-full w-full object-contain" />
                  </div>
                  <div className="text-center mt-2 text-sm font-semibold">{fname}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
