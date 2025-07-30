"use client";

import Link from "next/link";
import Image from "next/image";
import { Disclosure } from "@headlessui/react";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "#what-is-hiraya" },
    { name: "FAQs", href: "#faqs" },
    { name: "Contact Us", href: "#contact-us" },
    ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const section = document.querySelector(href);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "bg-white/90 shadow-lg backdrop-blur-md"
            : "bg-blue-800/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/img/HIRAYA.png"
              alt="Hiraya Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <span
              className={`text-xl font-bold tracking-wide transition-colors duration-300 ${
                isScrolled ? "text-gray-900" : "text-white drop-shadow-md"
              }`}
            >
              Hiraya Pathway Training Center
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <ul className="flex gap-6">
              {navigation.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`text-lg font-medium transition-colors duration-300 ${
                      isScrolled
                        ? "text-gray-800 hover:text-indigo-600"
                        : "text-white hover:text-yellow-300 drop-shadow-md"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="#"
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isScrolled
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-md"
              }`}
            >
              Book Now Your Discovery webinar
            </Link>
          </div>

          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button
                  aria-label="Toggle Menu"
                  className={`lg:hidden p-2 rounded-md transition-colors duration-300 ${
                    isScrolled ? "text-gray-900" : "text-white drop-shadow-md"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {open ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </Disclosure.Button>

                <Disclosure.Panel
                  className={`absolute top-full left-0 w-full px-6 py-5 transition-all duration-300 ease-in-out ${
                    isScrolled
                      ? "bg-white shadow-lg"
                      : "bg-blue-800/90 backdrop-blur-md"
                  }`}
                >
                  {navigation.map((item, i) => (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`block py-3 text-lg ${
                        isScrolled
                          ? "text-gray-800 hover:text-indigo-600"
                          : "text-white hover:text-yellow-300"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href="#"
                    className={`block mt-4 px-6 py-2 text-center rounded-md font-semibold ${
                      isScrolled
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "bg-yellow-400 text-blue-900 hover:bg-yellow-300"
                    }`}
                  >
                    Book Now Your Discovery webinar
                  </Link>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </nav>
    </div>
  );
};
