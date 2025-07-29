import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Video } from "@/components/Video";
import { Testimonials } from "@/components/Testimonials";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";
import { benefitOne, benefitTwo } from "@/components/data";
import BenefitsGrid from "@/components/BenefitsGrid";
import { AboutUsFeatured } from "@/components/AboutusFeatured";
import { Briefcase, Users, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <Container>
      {/* Hero Section */}
      <Hero />

      <AboutUsFeatured imageUrl="/img/Hirayanurse1.jpg" />

      {/* About Us Section */}
      <section
        id="about-us"
        className="w-screen relative left-1/2 right-1/2 -translate-x-1/2 py-16 bg-gray-50"
      >
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose Hiraya Pathway Training Center
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a pioneer in bridging Filipino nurses to Dubai healthcare careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <Briefcase className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Risk-Free Advancement</h3>
              <p className="text-gray-600">
                Zero financial risk. You only pay for the DataFlow Verification and your sponsor advances every cost.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <Users className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Premium Network</h3>
              <p className="text-gray-600">
                Exclusive ties to 30+ top hospitals and clinics across Dubai
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <CheckCircle className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">OnGoing Support</h3>
              <p className="text-gray-600">
                Alumni community and 24/7 assistance throughout your contract.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Benefits Sections */}
      
        <section className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-blue-100">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/Doc.png"
            alt="Benefits Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 w-full py-20">
          <div className="max-w-screen-xl mx-auto px-4">
            <BenefitsGrid
              title={benefitOne.title}
              desc={benefitOne.desc}
              bullets={benefitOne.bullets}
            />
            <BenefitsGrid
              title={benefitTwo.title}
              desc={benefitTwo.desc}
              bullets={benefitTwo.bullets}
            />
          </div>
        </div>
      </section>


      {/* Video Section */}
      <Video videoId="W5Dm2WCk8jg" />

      {/* Testimonials Section */}
      
        
        <Testimonials />
      

      {/* FAQ Section */}
      <Faq />

      {/* Call to Action */}
      <Cta />
    </Container>
  );
}
