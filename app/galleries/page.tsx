import Header from "../components/Header";
import Link from "next/link";

const galleries = [
  {
    title: "Proposals",
    href: "/galleries/proposals",
    description: "Emotional, cinematic proposal storytelling.",
  },
  {
    title: "Couples",
    href: "/galleries/couples",
    description: "Natural connection and timeless portraits.",
  },
  {
    title: "Families",
    href: "/galleries/families",
    description: "Warm, relaxed family memories.",
  },
  {
    title: "Portraits",
    href: "/galleries/portraits",
    description: "Editorial, personal, and creative portraits.",
  },
  {
    title: "Business",
    href: "/galleries/business",
    description: "Brand imagery, headshots, and content visuals.",
  },
  {
    title: "Automotive",
    href: "/galleries/automotive",
    description: "Showcase passion, craftsmanship, and character.",
  },
  {
    title: "Events",
    href: "/galleries/events",
    description: "Milestones, celebrations, and meaningful moments.",
  },
];

export default function GalleriesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-[#f5f1e8]">
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

      <Header />

      <section className="relative z-10 px-6 pb-24 pt-10 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.55em] text-white/35">
          Camvelle Galleries
        </p>

        <h1 className="mt-8 max-w-6xl text-5xl font-light leading-[0.9] tracking-[-0.08em] md:text-7xl lg:text-[7rem]">
          View galleries
          <br />
          by experience.
        </h1>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map((gallery, index) => (
            <Link
              key={gallery.title}
              href={gallery.href}
              className="group min-h-[360px] rounded-[3rem] border border-white/10 bg-white/[0.035] p-8 transition hover:border-white/25 hover:bg-white/[0.055]"
            >
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
                {String(index + 1).padStart(2, "0")} / Gallery
              </p>

              <div className="mt-40">
                <h2 className="text-5xl font-light tracking-[-0.07em]">
                  {gallery.title}
                </h2>

                <p className="mt-5 leading-8 text-white/50">
                  {gallery.description}
                </p>

                <span className="mt-8 inline-flex rounded-full border border-white/15 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70 group-hover:bg-white group-hover:text-black">
                  View Gallery
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
