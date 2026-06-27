"use client";

import { DICTIONARY } from "@/constants/dictionary";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SEO_LIMITS } from "../../constants";

type CombinationEditorProps = {
  title: string;
  setTitle: (value: string) => void;
  h1: string;
  setH1: (value: string) => void;
  metaDesc: string;
  setMetaDesc: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
}

/**
 * SEO content editor fields: Title, H1, Meta Description, and rich text content.
 */
export const CombinationEditor = ({
  title,
  setTitle,
  h1,
  setH1,
  metaDesc,
  setMetaDesc,
  content,
  setContent,
}: CombinationEditorProps) => {
  const d = DICTIONARY.admin.combinations;

  return (
    <>
      <h2 className="font-heading font-bold text-text-primary text-lg">
        {d.editorTitle}
      </h2>

      <div className="flex flex-col space-y-1">
        <Input
          id="combo-title"
          label={d.formTitle}
          value={title}
          maxLength={SEO_LIMITS.TITLE_MAX_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-1">
        <Input
          id="combo-h1"
          label={d.formH1}
          value={h1}
          maxLength={SEO_LIMITS.H1_MAX_LENGTH}
          onChange={(e) => setH1(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-1">
        <Textarea
          id="combo-meta"
          label={d.formMeta}
          value={metaDesc}
          maxLength={SEO_LIMITS.META_DESC_MAX_LENGTH}
          onChange={(e) => setMetaDesc(e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-text-primary mb-1">
          {d.formContent}
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
        />
      </div>
    </>
  );
};
