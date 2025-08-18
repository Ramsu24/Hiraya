"use client";

import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Video } from "@/components/Video";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";
import { benefitOne, benefitTwo } from "@/components/data";
import BenefitsGrid from "@/components/BenefitsGrid";
import { AboutUsFeatured } from "@/components/AboutusFeatured";
import { Briefcase, Users, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [step, setStep] = useState(0);
  const bullets = benefitTwo.bullets;

  const nextStep = () => setStep((prev) => (prev + 1) % bullets.length);
  const prevStep = () => setStep((prev) => (prev - 1 + bullets.length) % bullets.length);

  return (
    <Container>
      <Hero />
      <AboutUsFeatured imageUrl="/img/Hirayanurse1.jpg" />

      <section id="about-us" className="w-screen relative left-1/2 right-1/2 -translate-x-1/2 py-16 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose Hiraya Pathway Training Center
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a pioneer in supporting Filipino nurses pursuing UAE healthcare careers through exam preparation, credentialing guidance, and mentoring.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <Briefcase className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Risk-Free Advancement</h3>
              <p className="text-gray-600">
                Training support options may be available. Participants remain responsible for government/third-party unless covered by separate arrangements outside Hiraya
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <Users className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Premium Network</h3>
              <p className="text-gray-600">
                Industry collaborations and insights from the UAE healthcare sector inform our curriculum and mentoring; Hiraya does not represent or recruit for any institution.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
              <CheckCircle className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">OnGoing Support</h3>
              <p className="text-gray-600">
                Alumni community and 24/7 assistance throughout your training and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-blue-100">
        <div className="absolute inset-0 z-0">
          <Image src="/img/meds.png" alt="Join us background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 w-full py-24">
          <div className="max-w-screen-xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">{benefitOne.title}</h2>
            <p className="text-blue-700 mb-12">{benefitOne.desc}</p>

            {/* First Row */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {benefitOne.bullets.slice(0, 3).map((item, idx) => (
                <div key={idx} className="bg-yellow-100 rounded-xl shadow p-6 hover:shadow-lg hover:-translate-y-1 transition">
                  <div className="relative w-full h-40 mb-4">
                    <Image src={item.image} alt={item.title} fill className="object-contain px-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{item.title}</h3>
                  <p className="text-blue-800">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Centered Second Row */}
            <div className="flex flex-col md:flex-row justify-center gap-6">
              {benefitOne.bullets.slice(3, 5).map((item, idx) => (
                <div key={idx} className="bg-yellow-100 rounded-xl shadow p-6 hover:shadow-lg hover:-translate-y-1 transition w-full md:w-1/3">
                  <div className="relative w-full h-40 mb-4">
                    <Image src={item.image} alt={item.title} fill className="object-contain px-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{item.title}</h3>
                  <p className="text-blue-800">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-blue-100">
        <div className="absolute inset-0 z-0">
          <Image src="/img/Doc.png" alt="How it works Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 w-full py-20">
          <div className="max-w-screen-md mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">{benefitTwo.title}</h2>
            <p className="text-blue-700 mb-8">{benefitTwo.desc}</p>
            <div className="relative h-[360px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-blue-100 rounded-xl shadow p-6 flex flex-col items-center justify-center"
                >
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={bullets[step].image}
                      alt={bullets[step].title}
                      fill
                      className="object-contain px-6"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{bullets[step].title}</h3>
                  <p className="text-blue-800">{bullets[step].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={prevStep} className="bg-blue-600 text-white px-4 py-2 rounded">Previous</button>
              <button onClick={nextStep} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
            </div>
          </div>
        </div>
      </section>

      <Video videoId="W5Dm2WCk8jg" />
      <Faq />
      <Cta />
    </Container>
  );
}
