// app/page.tsx
import GameCanvas from '@/components/GameCanvas';

export const metadata = {
  title: "Amoeba Merge Puzzle",
  description: "A physics-based merge puzzle using Matter.js and PixiJS in Next.js.",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <h1 className="text-4xl font-extrabold text-white mb-6">
        Amoeba Merge Puzzle
      </h1>
      
      {/* The interactive, client-side game component */}
      <GameCanvas />
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This is built using Matter.js (Physics) and PixiJS (Rendering) for the required complex motion and visuals.
        </p>
      </div>
    </main>
  );
}