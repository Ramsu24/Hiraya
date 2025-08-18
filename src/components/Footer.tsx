"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Container } from "@/components/Container";

export function Footer() {
  const navigation = [
    { name: "Home", href: "#home" },
    { name: "About Us", href: "#what-is-hiraya" },
    { name: "FAQs", href: "#faqs" },
    { name: "Contact Us", href: "#contact-us" },
  ];

  const legal = [
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
    { name: "Legal", href: "#" },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const section = document.querySelector(href);
      if (section) section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // lock body scroll when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  return (
    <div className="bg-blue-100 text-blue-900 w-full pt-12 pb-6 px-4">
      <Container className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 gap-10 border-t border-blue-200 lg:grid-cols-5">
          {/* Contact */}
          <div id="contact-us" className="lg:col-span-2 scroll-mt-20">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Contact Us
            </h3>
            <div className="mb-6">
              <p className="text-sm font-semibold">Main Branch</p>
              <p className="text-blue-800">
                889 P. Paredes St, Don Lorenzo Building, Sampaloc, Manila
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold">New Branch</p>
              <p className="text-blue-800">
                Unit G - 003, Ground Floor, St. Vincent Gym,
                <br />
                Brgy. Campo Filipino, Naguilian Road, Baguio City
              </p>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold">Call Us</p>
              <p className="text-blue-800">
                +44 752 150 6511{" "}
                <span className="text-sm text-blue-700">(WHATSAPP)</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Email Us</p>
              <p className="text-blue-800">info@hiraya.asia</p>
            </div>
          </div>

          {/* Nav links */}
          <div>
            <div className="flex flex-wrap w-full -mt-2 -ml-3 lg:ml-0">
              {navigation.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="w-full px-4 py-2 text-blue-800 rounded-md hover:text-blue-600 focus:text-blue-600 focus:bg-blue-200 focus:outline-none"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="flex flex-wrap w-full -mt-2 -ml-3 lg:ml-0">
              {legal.map((item, index) =>
                item.name === "Legal" ? (
                  <button
                    key={index}
                    type="button"
                    onClick={openModal}
                    className="w-full text-left px-4 py-2 text-blue-800 rounded-md hover:text-blue-600 focus:text-blue-600 focus:bg-blue-200 focus:outline-none"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className="w-full px-4 py-2 text-blue-800 rounded-md hover:text-blue-600 focus:text-blue-600 focus:bg-blue-200 focus:outline-none"
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Social + CTA */}
          <div>
            <div className="font-semibold mb-2">Follow us</div>
            <div className="flex mt-5 space-x-5 text-blue-700">
              <a
                href="https://twitter.com/web3templates"
                target="_blank"
                rel="noopener"
              >
                <span className="sr-only">Twitter</span>
                <Twitter />
              </a>
              <a
                href="https://www.facebook.com/people/Hiraya-Pathway-Training-Center/61578678186850/"
                target="_blank"
                rel="noopener"
              >
                <span className="sr-only">Facebook</span>
                <Facebook />
              </a>
              <a
                href="https://www.instagram.com/auxesisreview"
                target="_blank"
                rel="noopener"
              >
                <span className="sr-only">Instagram</span>
                <Instagram />
              </a>
            </div>

            <div className="mt-8">
              <Link
                href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=2oL6x5gizEChlRfKiUssJgG8alKsvA9Ik4XEW8xjkIJUNFQ4M1A3NEVRSUhQMzI0UTBTNlBRRUZRMi4u"
                className="inline-block px-6 py-3 bg-yellow-400 text-blue-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                Book Now!
              </Link>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex justify-center items-center bg-black/60"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-[90%] relative">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                Legal Information
              </h3>
              <p className="text-gray-800">
                Hiraya Pathway Training Center is a private training and
                mentoring provider. We are not a recruitment or placement
                agency. We do not recruit, hire, or deploy workers, nor do we
                charge any placement or recruitment fees. Any recruitment or
                employment processes—if applicable—are conducted exclusively by
                DMW-licensed Philippine recruitment agencies and/or UAE
                employers.
              </p>
              <button
                onClick={closeModal}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Container>
      <Backlink />
    </div>
  );
}

// Icons
const Twitter = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.4 1.64a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.62 0-4.73 2.2-4.73 4.91 0 .38.04.76.12 1.12C7.69 5.86 4.07 3.91 1.64.92a4.91 4.91 0 0 0-.64 2.47 4.93 4.93 0 0 0 2.18 4.1A4.48 4.48 0 0 1 .96 7v.06c0 2.3 1.55 4.23 3.6 4.66a4.54 4.54 0 0 1-2.14.09 4.57 4.57 0 0 0 4.26 3.22A9.06 9.06 0 0 1 0 19.54 12.74 12.74 0 0 0 6.92 21c8.3 0 12.85-7.19 12.85-13.41 0-.2-.01-.4-.02-.6A9.43 9.43 0 0 0 23 3z" />
  </svg>
);

const Facebook = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M22.68 0H1.32C.59 0 0 .6 0 1.33v21.34C0 23.4.59 24 1.32 24h11.5v-9.33H9.69v-3.63h3.13V8.4c0-3.1 1.89-4.79 4.65-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.92c-1.5 0-1.79.72-1.79 1.76v2.3h3.57l-.47 3.63h-3.1V24h6.07c.73 0 1.32-.6 1.32-1.33V1.33C24 .6 23.41 0 22.68 0z" />
  </svg>
);

const Instagram = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M7.5 2h9A5.51 5.51 0 0 1 22 7.5v9a5.51 5.51 0 0 1-5.5 5.5h-9A5.51 5.51 0 0 1 2 16.5v-9A5.51 5.51 0 0 1 7.5 2zm0-2A7.5 7.5 0 0 0 0 7.5v9A7.5 7.5 0 0 0 7.5 24h9A7.5 7.5 0 0 0 24 16.5v-9A7.5 7.5 0 0 0 16.5 0h-9zM12 6.5A5.5 5.5 0 1 1 6.5 12 5.51 5.51 0 0 1 12 6.5zm0-2A7.5 7.5 0 1 0 19.5 12 7.5 7.5 0 0 0 12 4.5zM18 4.75a1.25 1.25 0 1 1-1.25 1.25A1.26 1.26 0 0 1 18 4.75z" />
  </svg>
);

const Linkedin = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M22.23 0H1.77A1.77 1.77 0 0 0 0 1.77v20.46A1.77 1.77 0 0 0 1.77 24h20.46A1.77 1.77 0 0 0 24 22.23V1.77A1.77 1.77 0 0 0 22.23 0zM7.12 20.45H3.56V9h3.56zM5.34 7.5A2.06 2.06 0 1 1 7.4 5.44 2.06 2.06 0 0 1 5.34 7.5zM20.45 20.45h-3.56v-5.58c0-1.33-.03-3.05-1.86-3.05s-2.14 1.46-2.14 2.96v5.67H9.33V9h3.42v1.56h.05a3.76 3.76 0 0 1 3.38-1.86c3.62 0 4.29 2.38 4.29 5.48z" />
  </svg>
);

const Backlink = () => null;
