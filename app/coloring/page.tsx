// app/coloring/page.tsx
import fs from "fs";
import path from "path";
import Link from "next/link";

export const dynamic = "force-dynamic";

function listCategorySlugs() {
  const root = path.join(process.cwd(), "public", "images");
  try {
    return fs.readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  } catch { return []; }
}

function listImages(slug: string) {
  const dir = path.join(process.cwd(), "public", "images", slug);
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => /\.(png|jpe?g|webp|gif|svg)$/i.test(n))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  } catch { return []; }
}

export default function ColoringAllOnMain() {
  const cats = listCategorySlugs();

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Coloring Gallery</h1>

        {cats.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            No categories found. Create subfolders under <code>public/images/&lt;category&gt;/</code> and add images.
          </div>
        ) : (
          <div className="space-y-10">
            {cats.map((slug) => {
              const files = listImages(slug);
              const title = slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
              if (files.length === 0) return null;
              return (
                <section key={slug}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">{title}</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((fname) => {
                      const src = `/images/${slug}/${fname}`;
                      const link = `/coloring/${slug}/${encodeURIComponent(fname)}`;
                      return (
                        <Link key={slug + "_" + fname} href={link}
                              className="rounded-xl border bg-white p-2 shadow hover:shadow-md transition block">
                          <div className="aspect-square overflow-hidden rounded-lg border bg-gray-50 flex items-center justify-center">
                            <img src={src} alt={fname} className="h-full w-full object-contain"/>
                          </div>
                          <div className="text-center mt-2 text-xs font-medium truncate">{fname}</div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
