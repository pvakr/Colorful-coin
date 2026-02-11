// app/coloring/page.tsx
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const IMG_EXT_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function imagesRoot() {
  return path.join(process.cwd(), "public", "images");
}

function listCategorySlugs() {
  const root = imagesRoot();
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listImages(slug: string) {
  const dir = path.join(imagesRoot(), slug);
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((n) => IMG_EXT_RE.test(n))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );
  } catch {
    return [];
  }
}

function stripExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

function findThumbnail(slug: string, fileName: string): string | null {
  const stem = stripExt(fileName);

  const genThumbAbs = path.join(
    imagesRoot(),
    slug,
    "_thumbs",
    `${stem}.webp`
  );
  if (fs.existsSync(genThumbAbs)) {
    return `/images/${slug}/_thumbs/${encodeURIComponent(`${stem}.webp`)}`;
  }

  const sideBySideAbs = path.join(
    imagesRoot(),
    slug,
    `${stem}-thumb.webp`
  );
  if (fs.existsSync(sideBySideAbs)) {
    return `/images/${slug}/${encodeURIComponent(`${stem}-thumb.webp`)}`;
  }

  return null;
}

export default function ColoringAllOnMain() {
  const cats = listCategorySlugs();

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-2">
              Coloring Gallery
              <Sparkles className="w-6 h-6 text-white/70" />
            </h1>
            <p className="text-white/75 mt-1">
              Choose from our collection of coloring pages
            </p>
          </div>
        </div>

        {cats.length === 0 ? (
          <div className="rounded-xl border bg-white/10 backdrop-blur p-6 text-white/80">
            No categories found. Create subfolders under{" "}
            <code>public/images/&lt;category&gt;/</code> and add images.
            <br />
            <span className="text-sm opacity-70">
              (Faster loads) Run the thumbnail generator so{" "}
              <code>_thumbs/&lt;name&gt;.webp</code> exists for each image.
            </span>
          </div>
        ) : (
          <div className="space-y-10">
            {cats.map((slug) => {
              const files = listImages(slug);
              if (files.length === 0) return null;

              const title = slug
                .split("-")
                .map((s) => s[0].toUpperCase() + s.slice(1))
                .join(" ");

              return (
                <section key={slug}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      {title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((fname) => {
                      const fullSrc = `/images/${slug}/${encodeURIComponent(
                        fname
                      )}`;
                      const thumbSrc =
                        findThumbnail(slug, fname) || fullSrc;
                      const link = `/coloring/${slug}/${encodeURIComponent(
                        fname
                      )}`;

                      return (
                        <Link
                          key={`${slug}_${fname}`}
                          href={link}
                          className="rounded-xl border bg-white/10 backdrop-blur p-2 shadow hover:shadow-lg transition-all hover:scale-105 block"
                        >
                          <div className="aspect-square overflow-hidden rounded-lg border bg-white/5 relative">
                            <Image
                              src={thumbSrc}
                              alt={fname}
                              fill
                              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
                              className="object-contain"
                            />
                          </div>
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
