import Image from "next/image";
import Link from "next/link";
import {
  CamvelleBody,
  CamvelleEyebrow,
  CamvelleHeading,
  CamvelleInnerPanel,
  CamvellePageShell,
  CamvellePanel,
  camvelleCreamButton,
  camvelleGhostButton,
} from "../components/CamvelleUI";

const services = [
  {
    title: "Proposal Photography",
    price: "Starting at $799.99",
    description:
      "Discreet planning, cinematic capture, emotional reactions, and beautifully preserved once-in-a-lifetime moments.",
  },
  {
    title: "Couples Sessions",
    price: "Starting at $299.99",
    description:
      "Natural connection, authentic storytelling, golden hour sessions, and timeless imagery that feels real.",
  },
  {
    title: "Family Portraits",
    price: "Starting at $399.99",
    description:
      "Relaxed sessions focused on genuine moments, connection, laughter, and images your family will keep forever.",
  },
  {
    title: "Portrait Sessions",
    price: "Starting at $299.99",
    description:
      "Personal branding, lifestyle portraits, graduation, creative shoots, and cinematic editorial-style imagery.",
  },
  {
    title: "Engagement Sessions",
    price: "Starting at $349.99",
    description:
      "Celebrate the season before the wedding with intentional imagery full of chemistry, style, and story.",
  },
  {
    title: "Business",
    price: "Starting at $849.99",
    description:
      "Create a lasting impression with authentic, high-quality brand photography.",
  },
  {
    title: "Real Estate",
    price: "Starting at $299.99",
    description:
      "Clean, polished property imagery designed to showcase spaces with clarity, depth, and market appeal.",
  },
  {
    title: "Automotive",
    price: "Starting at $399.99",
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
    <CamvellePageShell>
      <header className="relative z-[9999] mb-10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/branding/camvelle-logo.png"
            alt="Camvelle Creative"
            width={420}
            height={120}
            priority
            unoptimized
            className="h-14 w-auto object-contain sm:h-16 md:h-20"
          />
        </Link>

        <details className="relative z-[99999]">
          <summary
            className={`${camvelleCreamButton} list-none cursor-pointer [&::-webkit-details-marker]:hidden`}
          >
            Menu
          </summary>

          <div className="absolute right-0 top-16 z-[99999] w-80 rounded-[3rem] border border-white/10 bg-black/80 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
            <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-[0.32em] text-white/70">
              <Link href="/" className="hover:text-white">
                Home
              </Link>

              <Link href="/galleries" className="hover:text-white">
                Galleries
              </Link>

              <Link href="/services" className="text-white">
                Services
              </Link>

              <Link href="/book" className="hover:text-white">
                Book
              </Link>

              <Link href="/status" className="hover:text-white">
                Client Status
              </Link>

              <Link href="/login" className="hover:text-white">
                Studio Login
              </Link>
            </nav>
          </div>
        </details>
      </header>

      <CamvellePanel className="p-8 sm:p-10 md:p-14">
        <CamvelleEyebrow>Camvelle Services</CamvelleEyebrow>

        <CamvelleHeading>
          Cinematic
          <br />
          storytelling.
        </CamvelleHeading>

        <CamvelleBody>
          Timeless photography services designed around emotion, atmosphere,
          connection, and intentional storytelling.
        </CamvelleBody>
      </CamvellePanel>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => (
          <CamvelleInnerPanel
            key={service.title}
            className="group p-8 transition duration-500 hover:border-white/20 hover:bg-white/[0.04]"
          >
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/30">
              {String(index + 1).padStart(2, "0")} / Service
            </p>

            <h2 className="mt-8 text-4xl font-light leading-tight tracking-[-0.05em] text-white">
              {service.title}
            </h2>

            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/35">
              {service.price}
            </p>

            <p className="mt-8 text-base leading-8 text-white/55">
              {service.description}
            </p>

            <Link href="/book" className={`${camvelleGhostButton} mt-10 inline-flex`}>
              Book Session
            </Link>
          </CamvelleInnerPanel>
        ))}
      </section>

      <CamvellePanel className="mt-8 px-8 py-16 text-center sm:px-10 md:px-16 md:py-24">
        <CamvelleEyebrow>Ready When You Are</CamvelleEyebrow>

        <h2 className="mx-auto mt-8 max-w-4xl text-5xl font-light leading-[0.95] tracking-[-0.07em] text-white md:text-7xl">
          Let’s create
          <br />
          something unforgettable.
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-9 text-white/50">
          Every session is crafted intentionally to feel emotional, cinematic,
          and naturally timeless.
        </p>

        <Link href="/book" className={`${camvelleCreamButton} mt-12 inline-flex`}>
          Start Your Inquiry
        </Link>
      </CamvellePanel>
    </CamvellePageShell>
  );
}
