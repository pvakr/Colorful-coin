// scripts/generate-thumbnails.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const THUMB_MAX = 360;   // grid-friendly size
const QUALITY   = 72;

const ROOT = path.join(process.cwd(), "public", "images");
const IMG_EXT_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function listCategorySlugs() {
  try {
    return fs.readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listImages(slug) {
  const dir = path.join(ROOT, slug);
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
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

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function thumbAbsPath(slug, fileName) {
  const thumbsDir = path.join(ROOT, slug, "_thumbs");
  ensureDir(thumbsDir);
  const base = fileName.replace(/\.[^.]+$/, ""); // strip ext
  return path.join(thumbsDir, `${base}.webp`);
}

function needsBuild(src, thumb) {
  if (!fs.existsSync(thumb)) return true;
  const srcStat = fs.statSync(src);
  const thStat  = fs.statSync(thumb);
  return srcStat.mtimeMs > thStat.mtimeMs;
}

async function buildThumb(srcAbs, outAbs) {
  const img = sharp(srcAbs, { limitInputPixels: 268402689 });
  const meta = await img.metadata();

  const width  = meta.width  || THUMB_MAX;
  const height = meta.height || THUMB_MAX;
  const longer = Math.max(width, height);
  const target = Math.min(THUMB_MAX, longer);

  await img
    .resize({
      width:  width  >= height ? target : undefined,
      height: height >  width  ? target : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toFile(outAbs);
}

async function run() {
  if (!fs.existsSync(ROOT)) {
    console.error(`No images at ${ROOT}.`);
    process.exit(0);
  }

  const cats = listCategorySlugs();
  let total = 0, skipped = 0, built = 0, failed = 0;

  for (const slug of cats) {
    const files = listImages(slug);
    for (const fname of files) {
      if (/-thumb\.[^.]+$/i.test(fname)) { skipped++; continue; } // ignore manual thumbs

      const srcAbs = path.join(ROOT, slug, fname);
      const outAbs = thumbAbsPath(slug, fname);
      total++;

      try {
        if (needsBuild(srcAbs, outAbs)) {
          await buildThumb(srcAbs, outAbs);
          console.log(`✓ ${slug}/${fname} -> _thumbs/${path.basename(outAbs)}`);
          built++;
        } else {
          skipped++;
        }
      } catch (e) {
        failed++;
        console.warn(`✗ Failed ${slug}/${fname}: ${e.message}`);
      }
    }
  }

  console.log(`\nDone. Total: ${total}, Built: ${built}, Skipped: ${skipped}, Failed: ${failed}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
