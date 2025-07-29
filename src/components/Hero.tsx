import Image from "next/image";
import heroImg from "../../public/img/hc.jpg";

export const Hero = () => {
  return (
    <section
      id="home"
      className="relative w-full h-screen bg-blue-900 overflow-x-hidden"
      style={{
        marginLeft: 'calc(-50vw + 50%)', // Pulls section to the left edge
        width: '100vw', // Full viewport width
        left: 0, // Explicit left alignment
      }}
    >
      {/* Background Image: Full viewport coverage */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={heroImg}
          alt="Hero background"
          fill
          className="object-cover object-left opacity-40" // `object-left` aligns image to left
          priority
          sizes="100vw"
          style={{
            left: 0, // Force left-edge alignment
          }}
        />
      </div>

      {/* Content: Centered but without horizontal padding */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl px-0 text-center mx-auto h-screen">
        {/* Tagline */}
        <p className="mb-3 text-sm uppercase tracking-widest text-blue-200">
          Medical Training Review Center
        </p>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-yellow-400 leading-tight">
          Hiraya Pathway Training Center
        </h1>

        {/* Paragraph */}
        <p className="mt-6 text-lg md:text-xl leading-relaxed text-blue-100 max-w-2xl">
          Step into your Dubai nursing career—
          <span className="text-yellow-300 font-semibold">
            risk-free and employer-funded
          </span>
          . At Hiraya Pathway Training Center, every step of your journey is
          covered—from world-class DOH exam prep, PRC verification, and visa
          processing to flight booking and guaranteed employment.
          <br className="hidden md:block" />
          <br className="hidden md:block" />
          <span className="text-yellow-300 font-medium">
            No upfront costs. No financial burden. Just your future, unlocked.
          </span>
        </p>

        {/* Buttons */}
        <div className="relative z-10 flex flex-row items-center justify-center gap-4 mt-6">
          <a
            href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=2oL6x5gizEChlRfKiUssJgG8alKsvA9Ik4XEW8xjkIJUNFQ4M1A3NEVRSUhQMzI0UTBTNlBRRUZRMi4u"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-amber-400 rounded-lg shadow-lg hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full transform scale-105 bg-amber-300 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 rounded-lg"></span>
            <span className="relative z-10">🌅 Book A Slot Now</span>
          </a>
          <a
            href="https://www.instagram.com/auxesisreview"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-blue-900 bg-blue-200 rounded-lg shadow-lg hover:bg-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full transform scale-105 bg-blue-300 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 rounded-lg"></span>
            <span className="relative z-10 flex items-center gap-2">
              <Image
                src="/img/Instagram.png"
                alt="Instagram"
                width={24}
                height={24}
              />
              View on Instagram
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};