"use client";
import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/Container";
import { Stethoscope } from "lucide-react";
import medBg from "../../public/img/Med.png"; // adjust path as needed

interface VideoProps {
  videoId?: string;
}

export function Video({ videoId }: Readonly<VideoProps>) {
  const [playVideo, setPlayVideo] = useState(false);
  const actualVideoId = videoId || "W5Dm2WCk8jg";
  const thumbnailUrl = `https://img.youtube.com/vi/${actualVideoId}/hqdefault.jpg`;

  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 py-24 overflow-hidden bg-[#e3effe]">
        {/* Blurred background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 z-0"
          style={{
            backgroundImage: 'url("/img/Doc2.png")',
          }}
        />

      {/* Optional blur blob */}
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-yellow-200 rounded-full opacity-20 blur-3xl z-0" />

      <Container>
        <div className="relative z-10 text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4 text-[#1A2E40]">
            <Stethoscope className="w-6 h-6 text-[#facc15]" />
            <span className="font-semibold tracking-wide uppercase text-sm">For Aspiring Nurses</span>
          </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1A2E40] leading-tight mb-4">
            Take the First Step Toward <span className="text-[#eab308]">Your Dream Nursing Career</span>
            </h2>
          <p className="text-lg text-[#2f4b85] max-w-2xl mx-auto">
            Watch how Hiraya Pathway empowers Filipino nurses with real opportunities in UAE. Your journey to a better future starts with informed training.
          </p>
        </div>

        <div className="relative w-full h-[500px] max-w-4xl mx-auto overflow-hidden rounded-2xl cursor-pointer shadow-2xl border-4 border-[#FFD700] transition-transform hover:scale-[1.01] mb-8">
          {!playVideo ? (
            <div
              className="w-full h-full bg-cover bg-center relative"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
              onClick={() => setPlayVideo(true)}
            >
              <div className="absolute inset-0 bg-white bg-opacity-40" />
              <button
                className="absolute inset-auto w-16 h-16 text-[#FFD700] transform -translate-x-1/2 -translate-y-1/2 lg:w-24 lg:h-24 top-1/2 left-1/2 hover:scale-110 transition-transform duration-300"
                aria-label="Play Video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-lg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${actualVideoId}?autoplay=1&controls=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full aspect-video"
            ></iframe>
          )}
        </div>

        <div className="text-center">
          <a
            href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=2oL6x5gizEChlRfKiUssJgG8alKsvA9Ik4XEW8xjkIJUNFQ4M1A3NEVRSUhQMzI0UTBTNlBRRUZRMi4u"
            className="inline-block px-8 py-4 bg-[#facc15] text-[#1A2E40] font-semibold rounded-full shadow-md hover:bg-yellow-400 transition-all duration-300"
          >
            Start Your Journey Now
          </a>
        </div>
      </Container>
    </section>
  );
}
