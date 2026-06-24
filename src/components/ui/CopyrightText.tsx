"use client";

import { useEffect, useState } from "react";

interface CopyrightTextProps {
  text: string;
}

export const CopyrightText = ({ text }: CopyrightTextProps) => {
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <span>
      {text.replace("{year}", year)}
    </span>
  );
};
