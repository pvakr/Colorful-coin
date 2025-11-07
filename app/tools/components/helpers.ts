export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function colorDistance(a: any, b: any) {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
export function nearestBaseColor(rgb: any, baseColors: any[]) {
  return baseColors.reduce(
    (best, c) => {
      const d = colorDistance(rgb, hexToRgb(c.hex));
      return d < best.d ? { c, d } : best;
    },
    { c: baseColors[0], d: Infinity }
  ).c;
}
export function speak(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95; utter.pitch = 1.05;
  synth.cancel(); synth.speak(utter);
}
