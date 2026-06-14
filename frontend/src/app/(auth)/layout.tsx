import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-violet-700 text-white p-14">
        <Link href="/" className="flex items-center gap-3 font-semibold text-lg hover:opacity-90 transition-opacity">
          <div className="size-8 rounded-lg bg-white/15 grid place-items-center font-bold">T</div>
          Taskflow
        </Link>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight max-w-xs">Plan less. Ship more.</h1>
          <p className="mt-4 text-white/80 max-w-md">
            A focused task workspace — organize work, track status, and order your day exactly how
            you want it.
          </p>
        </div>
        <div />
      </div>
      <div className="flex items-center justify-center p-8">{children}</div>
    </div>
  );
}
