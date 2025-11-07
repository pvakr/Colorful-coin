// app/coloring/page.tsx
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";

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

/**
 * Strictly prefer auto-generated thumbnails:
 * 1) /images/<slug>/_thumbs/<stem>.webp  (from generator)
 * 2) fallback to side-by-side "<stem>-thumb.webp" if present
 * 3) fallback to full image
 */
function findThumbnail(slug: string, fileName: string): string | null {
  const stem = stripExt(fileName);

  // 1) Generated _thumbs/<stem>.webp
  const genThumbAbs = path.join(imagesRoot(), slug, "_thumbs", `${stem}.webp`);
  if (fs.existsSync(genThumbAbs)) {
    return `/images/${slug}/_thumbs/${encodeURIComponent(`${stem}.webp`)}`;
  }

  // 2) Side-by-side <stem>-thumb.webp (if someone added manually)
  const sideBySideAbs = path.join(imagesRoot(), slug, `${stem}-thumb.webp`);
  if (fs.existsSync(sideBySideAbs)) {
    return `/images/${slug}/${encodeURIComponent(`${stem}-thumb.webp`)}`;
  }

  // 3) No thumb, let caller fallback to full image
  return null;
}

export default function ColoringAllOnMain() {
  const cats = listCategorySlugs();

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* --- Start of Updated Header Layout --- */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Coloring Gallery</h1>
          
          <Link
            href="/" // Assuming "/" is the home page
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </Link>
        </div>
        {/* --- End of Updated Header Layout --- */}

        {cats.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            No categories found. Create subfolders under{" "}
            <code>public/images/&lt;category&gt;/</code> and add images.
            <br />
            <span className="text-sm">
              (Faster loads) Run the thumbnail generator so{" "}
              <code>_thumbs/&lt;name&gt;.webp</code> exists for each image.
            </span>
          </div>
        ) : (
          <div className="space-y-10">
            {cats.map((slug) => {
              const files = listImages(slug);
              const title = slug
                .split("-")
                .map((s) => s[0].toUpperCase() + s.slice(1))
                .join(" ");
              if (files.length === 0) return null;

              return (
                <section key={slug}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">{title}</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map((fname) => {
                      const fullSrc = `/images/${slug}/${encodeURIComponent(fname)}`;
                      const thumbSrc = findThumbnail(slug, fname) || fullSrc; // prefer thumb
                      const link = `/coloring/${slug}/${encodeURIComponent(fname)}`;

                      return (
                        <Link
                          key={slug + "_" + fname}
                          href={link}
                          className="rounded-xl border bg-white p-2 shadow hover:shadow-md transition block"
                        >
                          <div className="aspect-square overflow-hidden rounded-lg border bg-gray-50 relative">
                            {/* next/image lazy-loads; we render thumb or fallback */}
                            <Image
                              src={thumbSrc}
                              alt={fname}
                              fill
                              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
                              className="object-contain"
                              priority={false}
                              placeholder="empty"
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