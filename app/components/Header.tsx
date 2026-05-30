import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-[9999] flex items-center justify-between px-5 py-6 md:px-10">
      <Link href="/" className="flex items-center">
        <Image
          src="/branding/camvelle-logo.png"
          alt="CamVelle Creative"
          width={420}
          height={120}
          priority
          unoptimized
          className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
        />
      </Link>

      <details className="relative z-[99999]">
        <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02]">
          Menu
        </summary>

        <div className="absolute right-0 top-16 w-72 rounded-[2rem] border border-white/10 bg-black/80 p-6 backdrop-blur-2xl">
          <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.3em] text-white/75">
            <Link href="/">Home</Link>
            <Link href="/services">Services</Link>
            <Link href="/book">Book</Link>
            <Link href="/login">Studio Login</Link>
          </nav>
        </div>
      </details>
    </header>
  );
}
