"use client";
import Image from "next/image";

interface Bullet {
  title: string;
  desc: string;
  icon?: React.ReactElement;
  image?: any;
}

interface GridProps {
  title: string;
  desc: string;
  bullets: Bullet[];
}

export default function BenefitsGrid({ title, desc, bullets }: GridProps) {
  return (
    <div className="max-w-screen-xl mx-auto px-4 mb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-blue-900">{title}</h2>
        <p className="text-blue-700 mt-2">{desc}</p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {bullets.map((item, idx) => (
          <div
            key={idx}
            className="bg-yellow-50 rounded-xl shadow p-6 hover:shadow-lg hover:-translate-y-1 transition transform"
          >
            {item.image && (
              <div className="relative w-full h-52 mb-6">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain px-6"
                />
              </div>
            )}
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {item.title}
            </h3>
            <p className="text-blue-800">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}



