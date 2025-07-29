"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Container } from "@/components/Container";

import stud1img from "../../public/img/stud1.jpg";
import stud2img from "../../public/img/stud2.jpg";
import stud3img from "../../public/img/stud3.png";
import logo from "../../public/img/HIRAYA.png";

export const Testimonials = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const testimonials = [
    {
      quote: "Galing sobra ng instructors! I have learned much more with Hiraya and parang pagkatapos ng review ay sure pass na. The lectures were really similar to what appears on the board exams. Because of that, I topped the board!..",
      name: "Engr. Angelica Diongson",
      position: "VP Sales at Google",
      image: stud3img
    },
    {
      quote: "It was a great experience. Even if I was just enrolled in the online refresher and coaching program, it still felt like I was inside a classroom with my classmates...",
      name: "Engr. Jhilsean Brix Nimrod G. Olmedo",
      position: "Lead marketer at Netflix",
      image: stud2img
    },
    {
      quote: "Highly recommended ko talaga ang ARC sa future takers ng ChE boards kasi nasa kanila na talaga ang lahat tapos ang gagaling pa ng mga instructors!!! Bilang isa sa mga students ng online class, very good talaga experience ko here sa ARC!",
      name: "Engr. Miguel S. Bungalon",
      position: "Top 1, University of the Philippines - Los Baños",
      image: stud1img
    }
  ];

  const nextSlide = () => {
    if (isAnimating) return;
    setDirection("right");
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setDirection("left");
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? "right" : "left");
    setIsAnimating(true);
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 500); // Should match the duration of the animation

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const getSlideAnimation = (index: number) => {
    if (index !== currentSlide) return "hidden";
    
    if (isAnimating) {
      return direction === "right" 
        ? "animate-slide-in-right" 
        : "animate-slide-in-left";
    }
    
    return "animate-fade-in";
  };

  return (
    <section
      id="testimonials"
      className="relative w-screen left-1/2 -translate-x-1/2 py-24 bg-gradient-to-b from-[#142e69] to-[#2f4b85] text-white"
    >
      {/* Add the animation styles */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <Container>
        <h2 className="text-center text-4xl font-bold mb-4">
          What Our <span className="text-yellow-400">Students Say</span>
        </h2>
        <p className="text-center text-lg text-blue-100 mb-12">
          Hear directly from our successful graduates about their experiences.
        </p>

        <div className="relative max-w-4xl mx-auto bg-[#173b79] bg-opacity-70 rounded-xl shadow-lg p-10 text-center overflow-hidden">
          <div className="mb-6">
            <Image
              src={logo}
              alt="Hiraya Logo"
              width={64}
              height={64}
              className="mx-auto"
            />
          </div>

          {/* Testimonial content with animation */}
          <div className="min-h-[200px] relative">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`${getSlideAnimation(index)}`}
              >
                {index === currentSlide && (
                  <>
                    <p className="text-xl leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-4">
                      <div className="w-14 h-14 overflow-hidden rounded-full border-2 border-yellow-300">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={56}
                          height={56}
                          placeholder="blur"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-blue-100">
                          {testimonial.position}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
            aria-label="Previous testimonial"
            disabled={isAnimating}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
            aria-label="Next testimonial"
            disabled={isAnimating}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="mt-8 flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-yellow-400' : 'bg-white opacity-40'}`}
                aria-label={`Go to testimonial ${index + 1}`}
                disabled={isAnimating || index === currentSlide}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};