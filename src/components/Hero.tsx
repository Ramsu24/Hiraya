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
          Live up your international dreams
        </p>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-yellow-400 leading-tight">
          Hiraya Pathway Training Center
        </h1>

        {/* Paragraph */}
        <p className="mt-6 text-lg md:text-xl leading-relaxed text-blue-100 max-w-2xl">
          Step into your UAE nursing career—
          <span className="text-yellow-300 font-semibold">
            focused on DOH exam preparation,
          </span>
          credentialing guidance and program support!
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
            <span className="relative z-10">Book A Slot Now</span>
          </a>
          <a
            href="https://www.facebook.com/people/Hiraya-Pathway-Training-Center/61578678186850/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-blue-900 bg-blue-200 rounded-lg shadow-lg hover:bg-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full transform scale-105 bg-blue-300 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:scale-100 rounded-lg"></span>
            <span className="relative z-10 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.68 0H1.32C.59 0 0 .6 0 1.33v21.34C0 23.4.59 24 1.32 24h11.5v-9.33H9.69v-3.63h3.13V8.4c0-3.1 1.89-4.79 4.65-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.92c-1.5 0-1.79.72-1.79 1.76v2.3h3.57l-.47 3.63h-3.1V24h6.07c.73 0 1.32-.6 1.32-1.33V1.33C24 .6 23.41 0 22.68 0z" />
              </svg>
              View on Facebook
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};