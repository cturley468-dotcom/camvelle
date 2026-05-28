import Link from "next/link";
import Image from "next/image";

const galleries = [
  {
    title: "Proposals",
    number: "01",
    description:
      "Quiet planning, emotional reactions, and cinematic storytelling for once-in-a-lifetime moments.",
  },
  {
    title: "Couples",
    number: "02",
    description:
      "Natural connection, movement, atmosphere, and timeless images that feel honest and intimate.",
  },
  {
    title: "Families",
    number: "03",
    description:
      "Relaxed family storytelling focused on connection, laughter, warmth, and real moments.",
  },
  {
    title: "Portraits",
    number: "04",
    description:
      "Editorial-inspired portraits for personal branding, graduation, lifestyle, and creative sessions.",
  },
  {
    title: "Business",
    number: "05",
    description:
      "Clean visual branding, professional imagery, headshots, product moments, and content-ready visuals.",
  },
  {
    title: "Events",
    number: "06",
    description:
      "Milestone celebrations, small gatherings, and meaningful moments captured with intention.",
  },
];

export default function PortfolioPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(80,70,180,0.16),transparent_26%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.08),transparent_30%)]" />

        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* HEADER */}
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
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link href="/portfolio" className="text-white">
                Portfolio
              </Link>

              <Link href="/services" className="hover:text-white">
                Services
              </Link>

              <Link href="/book" className="hover:text-white">
                Book
              </Link>

              <Link href="/login" className="hover:text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-6 pb-10 pt-10 md:px-10 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
            CAMVELLE PORTFOLIO
          </p>

          <h1 className="mt-8 max-w-6xl text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#f5f1e8] md:text-7xl lg:text-[7rem]">
            Choose the
            <br />
            experience.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-9 text-white/50 md:text-xl">
            Explore the visual direction behind each session type — proposals,
            couples, families, portraits, brands, and meaningful events.
          </p>
        </div>
      </section>

      {/* GALLERIES */}
      <section className="relative z-10 px-6 pb-20 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {galleries.map((gallery, index) => (
            <Link
              key={gallery.title}
              href="/book"
              className={`group relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.05] ${
                index === 0 ? "min-h-[520px] md:col-span-2" : "min-h-[420px]"
              }`}
            >
              <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_60%_30%,rgba(255,255,255,0.13),transparent_32%)]" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                  {gallery.number} / Gallery
                </p>

                <div>
                  <h2 className="text-5xl font-light leading-none tracking-[-0.07em] md:text-7xl">
                    {gallery.title}
                  </h2>

                  <p className="mt-6 max-w-xl text-lg leading-8 text-white/50">
                    {gallery.description}
                  </p>

                  <div className="mt-10 inline-flex rounded-full border border-white/15 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70 transition group-hover:bg-white group-hover:text-black">
                    View / Book
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-28 md:px-10">
        <div className="mx-auto max-w-7xl rounded-[3rem] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl md:px-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.5em] text-white/35">
            READY TO BEGIN
          </p>

          <h2 className="mx-auto mt-8 max-w-4xl text-5xl font-light leading-[0.95] tracking-[-0.07em] md:text-7xl">
            Let’s build your
            <br />
            visual story.
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-9 text-white/50">
            Choose your session type, share your vision, and start the process
            with a simple booking inquiry.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/book"
              className="rounded-full bg-[#f5f0e7] px-10 py-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02] hover:bg-white"
            >
              Book Session
            </Link>

            <Link
              href="/services"
              className="rounded-full border border-white/15 bg-white/[0.03] px-10 py-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70 transition hover:bg-white hover:text-black"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
