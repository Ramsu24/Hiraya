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
      className="scroll-mt-32 w-full max-w-2xl p-2 mx-auto rounded-2xl"
    >
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
                        className="px-4 pt-4 pb-2 text-gray-500 dark:text-gray-300"
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
    </section>
  );
};

const faqdata = [
  {
    question: "Do I pay anything upfront?",
    answer: "No. All program costs are funded by your employer. You only begin shared repayments via salary deductions after contract commencement.",
  },
  {
    question: "How long will the process take?",
    answer: "Typically 4–6 months from enrollment to arrival in Dubai..",
  },
  {
    question: "What is your refund policy? ",
    answer:
      "If you're unhappy with your purchase for any reason, email us within 90 days and we'll refund you in full, no questions asked.",
  },
  {
    question: "What salaries can I expect? ",
    answer:
      "Monthly packages range from AED 5,000 to AED 10,000+ (Php 78,000-156,000+), tax-free, plus benefits.",
  },
];
