import React from "react";
import { Container } from "@/components/Container";


export const Cta = () => {
  return (
    <Container>
      <div className="flex flex-wrap items-center justify-between w-full max-w-4xl gap-5 mx-auto text-white bg-indigo-600 px-7 py-7 lg:px-12 lg:py-12 lg:flex-nowrap rounded-xl">
        <div className="flex-grow text-center lg:text-left">
          <h2 className="text-2xl font-medium lg:text-3xl">
            Ready to Launch Your UAE Nursing Career?
          </h2>
          <p className="mt-2 font-medium text-white text-opacity-90 lg:text-xl">
            Join Hiraya Pathway Training Center today and start your DOH Exam Journey with Hiraya Pathway Training Center— training, credentialing guidance, and mentoring.
          </p>
        </div>
      </div>
    </Container>
  );
};
