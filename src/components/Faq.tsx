"use client";
import React from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { SectionTitle } from "@/components/SectionTitle"; // Adjust path if needed

export const Faq = () => {
  return (
 <section
  id="faqs"
  className="scroll-mt-32 w-full px-4 py-12"
>
  <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg">
    {/* Dummy anchor element to catch scroll position */}
    <div className="h-12" aria-hidden="true"></div>

    <h2 className="text-3xl font-semibold text-center text-indigo-600 mb-4">
      Frequently Asked Questions
    </h2>

    {/* Section title for context */}
    <SectionTitle>
      <span className="mb-8 text-center text-black-600 dark:text-gray-300 block">
        Answer your customers possible questions here, it will increase the
        conversion rate as well as support or chat requests.
      </span>
    </SectionTitle>

    {faqdata.map((item) => (
      <div key={item.question} className="mb-5">
        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton className="flex items-center justify-between w-full px-4 py-4 text-lg text-left text-gray-800 rounded-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-100 focus-visible:ring-opacity-75 dark:bg-trueGray-800 dark:text-gray-200">
                <span>{item.question}</span>
                <ChevronUpIcon
                  className={`${
                    open ? "transform rotate-180" : ""
                  } w-5 h-5 text-indigo-500`}
                />
              </DisclosureButton>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { height: "auto", opacity: 1 },
                      collapsed: { height: 0, opacity: 0 },
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <DisclosurePanel
                      static
                      className="px-4 pt-4 pb-2 text-gray-600 dark:text-gray-300"
                    >
                      {item.answer}
                    </DisclosurePanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>
      </div>
    ))}
  </div>
</section>

  );
};

const faqdata = [
  {
    question: "Is this program truly zero-cost at enrollment?",
    answer: "Yes. You pay nothing upfront—no review fees, no exam fees, and no placement fees All costs are advanced on your behalf, ensuring a completely cash-free start to your UAE nursing journey.",
  },
  {
    question: "What is the typical timeline from application to deployment?",
    answer: "The average process takes 4–6 months, depending on exam schedules, document processing, and employer interview timing. Our team will guide you at every stage to keep your deployment on track. Note that this program is for PRC Registered Nurses only.",
  },
  {
    question: "How competitive are UAE nurse salaries?",
    answer: "Salaries for Filipino nurses in UAE generally range from AED 5,000 to AED 8,000+ per month (Php. 78,000-124,000) TAX-FREE, with benefits that may include housing, health insurance, and annual airfare.",
  },
  {
    question: "How are employers selected for me? ",
    answer:
      "Our recruitment network evaluates your experience, specialty, and preferences to match you with suitable, reputable UAE employers. You will receive detailed job offers and contract terms before making any commitment.",
  },
];
