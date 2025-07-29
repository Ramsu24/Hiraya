"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center order-last ">
      {/* Always light mode, no toggle */}
      <span className="text-gray-800"></span>
    </div>
  );
};

export default ThemeChanger;
