"use client";

import { useEffect, useState } from "react";
import { formatTemplate } from "@/utils/template";

type CopyrightTextProps = {
  text: string;
}

export const CopyrightText = ({ text }: CopyrightTextProps) => {
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <span>
      {formatTemplate(text, { year })}
    </span>
  );
};
