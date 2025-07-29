import Image from "next/image";

export function AboutUsFeatured({ imageUrl = "/img/nurse1.jpg" }) {
  return (
    <section
      className="relative py-20 overflow-hidden bg-[#d4ebf9]"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
        left: 0
      }}
    >
      <div className="relative z-10">
        {/* What is Hiraya Section */}
        <div id="what-is-hiraya" className="text-center max-w-4xl mx-auto px-6 mb-20">
          <h2 className="text-4xl font-extrabold text-[#1A2E40] mb-6">
            What is <span className="text-yellow-400">Hiraya Pathway</span> Training Center?
          </h2>
          <p className="text-lg text-[#2f4b85] leading-relaxed">
            Hiraya Pathway Training Center turns every Filipino nurse&apos;s ambition for an international nursing career into reality—completely cost-free and guaranteed. Through our exclusive partnership with leading Dubai healthcare employers, we fund every step of your journey: from intensive DOH exam review to visa processing, flight booking, and beyond. Upon passing the DOH exam, your employer through Hiraya ensures 100% placement and covers all associated deployment costs, so you embark on your new career with zero financial burden.
          </p>
        </div>

        {/* Transforming Nursing Careers Bullet Section */}
        <div id="about-us" className="w-full px-0">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2 h-96 relative rounded-xl overflow-hidden">
              <Image
                src={imageUrl}
                alt="About Hiraya Pathway"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="w-full md:w-1/2 px-6">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">
                Transforming Nursing Careers
              </h2>
              <div className="space-y-6">
                {[
                  "Zero-upfront cost program",
                  "12-week intensive DOH exam prep",
                  "Document processing & visa support",
                  "Guaranteed Dubai employment",
                  "Ongoing mentorship program"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-amber-400 rounded-full p-1 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
