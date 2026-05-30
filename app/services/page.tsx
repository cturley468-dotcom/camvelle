import Link from "next/link";

const services = [
  {
    title: "Proposal Photography",
    price: "Starting at $800",
    description:
      "Discreet planning, cinematic capture, emotional reactions, and beautifully preserved once-in-a-lifetime moments.",
  },
  {
    title: "Couples Sessions",
    price: "Starting at $300",
    description:
      "Natural connection, authentic storytelling, golden hour sessions, and timeless imagery that feels real.",
  },
  {
    title: "Family Portraits",
    price: "Starting at $400",
    description:
      "Relaxed sessions focused on genuine moments, connection, laughter, and images your family will keep forever.",
  },
  {
    title: "Portrait Sessions",
    price: "Starting at $300",
    description:
      "Personal branding, lifestyle portraits, graduation, creative shoots, and cinematic editorial-style imagery.",
  },
  {
    title: "Engagement Sessions",
    price: "Starting at $350",
    description:
      "Celebrate the season before the wedding with intentional imagery full of chemistry, style, and story.",
  },
  {
    title: "Business",
    price: "Starting at $800",
    description:
      "Create a lasting impression with authentic, high-quality brand phtography.",
  },
  {
    title: "Real-Estate",
    price: "Starting at $350",
    description:
      "Clean, polished property imagery designed to showcase spaces with clarity, depth, and market appeal.",
  },
  {
    title: "Automotive",
    price: "Starting at $425",
    description:
      "Showcase the passion, craftsmanship, and character behind every vehicle with naturally timeless imagery.",
  },
  {
    title: "Events",
    price: "Custom Quote",
    description:
      "Small gatherings, celebrations, milestone events, and custom storytelling coverage tailored to your vision.",
  },
];

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
     {/* BACKGROUND */}
<div className="pointer-events-none fixed inset-0">
  <div
    className="absolute inset-0 bg-cover bg-center bg-fixed"
    style={{
      backgroundImage: "url('/backgrounds/camvelle-background.png')",
    }}
  />

  {/* subtle dark overlay for readability */}
  <div className="absolute inset-0 bg-black/40" />

  {/* optional luxury vignette */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.45) 100%)",
    }}
  />
</div>


      {/* HEADER */}
      <header className="relative z-[9999] flex items-center justify-between px-5 py-6 md:px-10">
        <Link href="/" className="flex items-center">
          <img
            src="/branding/camvelle-logo.png"
            alt="CamVelle Creative"
            className="h-12 w-auto object-contain md:h-16 lg:h-20 xl:h-24"
          />
        </Link>

        <details className="relative z-[99999]">
          <summary className="list-none cursor-pointer rounded-full border border-white/10 bg-[#f5f0e7] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02]">
            Menu
          </summary>

          <div className="absolute right-0 top-16 w-72 rounded-[3rem] border border-white/10 bg-black/80 p-6 backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.3em] text-white/75">
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link href="/services" className="text-white">
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
            CAMVELLE SERVICES
          </p>

          <h1 className="mt-8 max-w-5xl text-5xl font-light leading-[0.9] tracking-[-0.08em] text-[#f5f1e8] md:text-7xl lg:text-[7rem]">
            Cinematic
            <br />
            storytelling.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-9 text-white/50 md:text-xl">
            Timeless photography services designed around emotion,
            atmosphere, connection, and intentional storytelling.
          </p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="relative z-10 px-6 pb-20 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                {String(index + 1).padStart(2, "0")} / SERVICE
              </p>

              <h2 className="mt-8 text-4xl font-light leading-tight tracking-[-0.05em] text-[#f5f1e8]">
                {service.title}
              </h2>

              <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/35">
                {service.price}
              </p>

              <p className="mt-8 leading-8 text-white/55">
                {service.description}
              </p>

              <Link
                href="/book"
                className="mt-10 inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/30 hover:bg-white hover:text-black"
              >
                Book Session
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-28 md:px-10">
        <div className="mx-auto max-w-7xl rounded-[3rem] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl md:px-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.5em] text-white/35">
            READY WHEN YOU ARE
          </p>

          <h2 className="mx-auto mt-8 max-w-4xl text-5xl font-light leading-[0.95] tracking-[-0.07em] md:text-7xl">
            Let’s create
            <br />
            something unforgettable.
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-9 text-white/50">
            Every session is crafted intentionally to feel emotional,
            cinematic, and naturally timeless.
          </p>

          <Link
            href="/book"
            className="mt-12 inline-flex items-center justify-center rounded-full bg-[#f5f0e7] px-10 py-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-black transition hover:scale-[1.02] hover:bg-white"
          >
            Start Your Inquiry
          </Link>
        </div>
      </section>
    </main>
  );
}
