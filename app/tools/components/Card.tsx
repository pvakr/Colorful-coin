export default function Card({ children, className = "" }: any) {
  return (
    <div className={`rounded-3xl bg-white/80 p-5 shadow-xl backdrop-blur ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  );
}
