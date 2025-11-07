"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
    // @ts-ignore
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
    if (h.length === 3) h = h.split("").map(ch => ch + ch).join(""); // support #fff
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/coloring" className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50">← Home</Link>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              Tolerance
              <input type="range" min={0} max={140} value={tolerance}
                     onChange={(e) => setTolerance(parseInt(e.target.value, 10))}/>
              <span className="tabular-nums">{tolerance}</span>
            </label>
            <button onClick={onUndo} className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50">Undo</button>
            <button onClick={onRedo} className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50">Redo</button>
            <button onClick={onReset} className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50">Reset</button>
            <button onClick={onDownload} className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50">Download</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="rounded-xl border bg-white p-3 shadow">
            <canvas ref={canvasRef} onClick={onCanvasClick} className="w-full h-auto cursor-crosshair block rounded-md"/>
          </div>

          <aside className="rounded-xl border bg-white p-4 shadow">
            <h3 className="text-sm font-semibold mb-2">Palette</h3>
            <div className="grid grid-cols-8 gap-2 mb-3">
              {PALETTE.map((c) => (
                <button key={c} aria-label={c} onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-md border ${color===c ? "ring-2 ring-blue-500 border-blue-600" : "border-gray-300 hover:scale-105"} transition`}
                        style={{ backgroundColor: c }}/>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                     className="h-8 w-12 p-0 bg-transparent border rounded"/>
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                     className="border rounded px-2 py-1 text-sm w-28"/>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
