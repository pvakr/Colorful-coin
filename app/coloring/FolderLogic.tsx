"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, RotateCcw, Undo, Redo, Palette, Sparkles } from "lucide-react";

type Props = {
  title: string;
  imageSrc: string;
  maxCanvasPx?: number;
  initialColor?: string;
  initialTolerance?: number;
};

const PALETTE = [
  "#000000","#FFFFFF",
  "#F87171","#FB923C","#FBBF24","#A3E635","#34D399","#22D3EE","#60A5FA","#A78BFA","#F472B6",
  "#EF4444","#EA580C","#D97706","#65A30D","#0D9488","#0891B2","#2563EB","#7C3AED","#DB2777",
  "#9CA3AF","#111827"
];

export default function ColoringImage({
  title,
  imageSrc,
  maxCanvasPx = 1024,
  initialColor = "#ff6ad5",
  initialTolerance = 28,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [color, setColor] = useState(initialColor);
  const [tolerance, setTolerance] = useState(initialTolerance);
  const hist = useRef<ImageData[]>([]);
  const future = useRef<ImageData[]>([]);

  const setupCanvas = () => {
    const c = canvasRef.current!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.min(maxCanvasPx, c.parentElement?.clientWidth || maxCanvasPx);
    c.style.width = cssWidth + "px";
    c.style.height = "auto";
    c.width = Math.floor(maxCanvasPx * dpr);
    c.height = Math.floor(maxCanvasPx * dpr);
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, dpr };
  };

  const whiteBG = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
  };

  const drawImageFit = () => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img) return;
    const { ctx } = setupCanvas();
    whiteBG(ctx);
    const cw = maxCanvasPx, ch = maxCanvasPx;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.min(cw/iw, ch/ih);
    const w = Math.floor(iw * scale), h = Math.floor(ih * scale);
    const x = Math.floor((cw - w) / 2), y = Math.floor((ch - h) / 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, w, h);
    hist.current = [ctx.getImageData(0, 0, c.width, c.height)];
    future.current = [];
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; drawImageFit(); };
    img.src = imageSrc;
  }, [imageSrc]);

  const rgbaAt = (img: ImageData, x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    const d = img.data;
    return [d[i], d[i+1], d[i+2], d[i+3]] as [number,number,number,number];
  };
  const setRgba = (img: ImageData, x: number, y: number, rgba: [number,number,number,number]) => {
    const i = (y * img.width + x) * 4;
    const d = img.data;
    d[i]=rgba[0]; d[i+1]=rgba[1]; d[i+2]=rgba[2]; d[i+3]=rgba[3];
  };
  const hexToRgba = (hex: string): [number,number,number,number] => {
    if (!hex) return [0,0,0,255];
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0,0,0,255];
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return [r,g,b,255];
  };
  const colorDist = (a: number[], b: number[]) => {
    const dr=a[0]-b[0], dg=a[1]-b[1], db=a[2]-b[2];
    return Math.sqrt(dr*dr + dg*dg + db*db);
  };

  const floodFill = (x: number, y: number, fillColor: [number,number,number,number], tol: number) => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const w = c.width, h = c.height;
    const img = ctx.getImageData(0,0,w,h);
    const target = rgbaAt(img, x, y);
    if (colorDist(target, fillColor) <= tol) return;
    const visited = new Uint8Array(w*h);
    const within = (xx:number,yy:number)=>xx>=0&&xx<w&&yy>=0&&yy<h;
    const stack: Array<[number,number]> = [[x,y]];
    while (stack.length) {
      let [cx, cy] = stack.pop()!;
      let lx = cx;
      while (lx >= 0 && !visited[cy*w+lx] && colorDist(rgbaAt(img, lx, cy), target) <= tol) lx--;
      lx++;
      let rx = cx;
      while (rx < w && !visited[cy*w+rx] && colorDist(rgbaAt(img, rx, cy), target) <= tol) rx++;
      rx--;
      for (let i=lx; i<=rx; i++) { setRgba(img, i, cy, fillColor); visited[cy*w + i] = 1; }
      for (const ny of [cy-1, cy+1]) {
        if (!within(0, ny)) continue;
        let inSpan = false, start = lx;
        for (let nx=lx; nx<=rx; nx++) {
          const idx = ny*w + nx;
          if (!visited[idx] && colorDist(rgbaAt(img, nx, ny), target) <= tol) {
            if (!inSpan) { start = nx; inSpan = true; }
          } else if (inSpan) {
            stack.push([Math.floor((start + nx - 1)/2), ny]);
            inSpan = false;
          }
        }
        if (inSpan) stack.push([Math.floor((start + rx)/2), ny]);
      }
    }
    hist.current.push(img);
    future.current = [];
    ctx.putImageData(img, 0, 0);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    floodFill(x, y, hexToRgba(color), tolerance);
  };

  const onReset = () => drawImageFit();
  const onUndo = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    if (hist.current.length > 1) {
      const last = hist.current.pop()!;
      future.current.push(last);
      ctx.putImageData(hist.current[hist.current.length-1], 0, 0);
    }
  };
  const onRedo = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    if (future.current.length) {
      const img = future.current.pop()!;
      hist.current.push(img);
      ctx.putImageData(img, 0, 0);
    }
  };
  const onDownload = () => {
    const a = document.createElement("a");
    a.download = `${title.toLowerCase().replace(/\s+/g,"-")}.png`;
    a.href = canvasRef.current!.toDataURL("image/png");
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-400" />
                  {title}
                </h1>
                <p className="text-sm text-white/60">Click to fill areas with color</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tolerance */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 backdrop-blur-md">
                <span className="text-xs text-white/60">Tolerance</span>
                <input
                  type="range"
                  min={0}
                  max={140}
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="w-20 h-2 rounded-full accent-purple-500 bg-white/20"
                />
                <span className="text-xs text-white/80 tabular-nums w-6">{tolerance}</span>
              </div>

              <motion.button
                onClick={onUndo}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md"
                title="Undo"
              >
                <Undo className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={onRedo}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md"
                title="Redo"
              >
                <Redo className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Reset</span>
              </motion.button>

              <motion.button
                onClick={onDownload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-white font-medium shadow-lg shadow-purple-500/25"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Download</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4">
              <canvas
                ref={canvasRef}
                onClick={onCanvasClick}
                className="w-full h-auto cursor-crosshair rounded-lg block"
              />
            </div>
          </motion.div>

          {/* Palette Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="font-semibold">Color Palette</h2>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-7 gap-2">
              {PALETTE.map((c) => (
                <motion.button
                  key={c}
                  onClick={() => setColor(c)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-9 w-9 rounded-lg border-2 transition-all ${
                    color === c
                      ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent border-white"
                      : "border-white/20 hover:border-white/40"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>

            {/* Custom Color */}
            <div className="space-y-3">
              <label className="text-sm text-white/60">Custom Color</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-12 rounded-xl cursor-pointer border-0"
                  />
                </div>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white font-mono uppercase backdrop-blur-md focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                />
              </div>
            </div>

            {/* Selected Color Preview */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/60 mb-2">Selected</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl shadow-lg border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-lg font-mono font-bold text-white uppercase">{color}</p>
                  <p className="text-xs text-white/40">Click canvas to fill</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
}
