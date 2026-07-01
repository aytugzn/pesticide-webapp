import { formatTemplate } from "@/utils/template";

type CopyrightTextProps = {
  text: string;
}

const CURRENT_YEAR = new Date().getFullYear().toString();

export const CopyrightText = ({ text }: CopyrightTextProps) => {
  return (
    <span>
      {formatTemplate(text, { year: CURRENT_YEAR })}
    </span>
  );
};
