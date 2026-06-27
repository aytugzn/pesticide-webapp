"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { DICTIONARY } from "@/constants/dictionary";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const ICON_SIZE = 18;

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-brand-border bg-brand-surface-light rounded-t-brand-md">
      <Button
        title={DICTIONARY.admin.tinymce.bold}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-brand-sm transition-colors ${
          editor.isActive("bold")
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.bold}
      >
        <Bold size={ICON_SIZE} />
      </Button>
      <Button
        title={DICTIONARY.admin.tinymce.italic}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-brand-sm transition-colors ${
          editor.isActive("italic")
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.italic}
      >
        <Italic size={ICON_SIZE} />
      </Button>

      <div className="w-px h-6 bg-brand-border mx-1" />

      <Button
        title={DICTIONARY.admin.tinymce.heading2}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-brand-sm transition-colors font-bold ${
          editor.isActive("heading", { level: 2 })
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.heading2}
      >
        <Heading2 size={ICON_SIZE} />
      </Button>
      <Button
        title={DICTIONARY.admin.tinymce.heading3}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded-brand-sm transition-colors font-bold ${
          editor.isActive("heading", { level: 3 })
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.heading3}
      >
        <Heading3 size={ICON_SIZE} />
      </Button>

      <div className="w-px h-6 bg-brand-border mx-1" />

      <Button
        title={DICTIONARY.admin.tinymce.bulletList}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-brand-sm transition-colors ${
          editor.isActive("bulletList")
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.bulletList}
      >
        <List size={ICON_SIZE} />
      </Button>
      <Button
        title={DICTIONARY.admin.tinymce.orderedList}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-brand-sm transition-colors ${
          editor.isActive("orderedList")
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-text-secondary hover:bg-brand-surface-muted"
        }`}
        aria-label={DICTIONARY.admin.tinymce.orderedList}
      >
        <ListOrdered size={ICON_SIZE} />
      </Button>

      <div className="flex-1" />

      <Button
        title={DICTIONARY.admin.tinymce.undo}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded-brand-sm text-text-secondary hover:bg-brand-surface-muted transition-colors disabled:opacity-50"
        aria-label={DICTIONARY.admin.tinymce.undo}
      >
        <Undo size={ICON_SIZE} />
      </Button>
      <Button
        title={DICTIONARY.admin.tinymce.redo}
        variant="unstyled"
        size="none"
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded-brand-sm text-text-secondary hover:bg-brand-surface-muted transition-colors disabled:opacity-50"
        aria-label={DICTIONARY.admin.tinymce.redo}
      >
        <Redo size={ICON_SIZE} />
      </Button>
    </div>
  );
};

export const RichTextEditor = ({
  value,
  onChange,
  className = "",
}: RichTextEditorProps) => {
  // Always holds the latest onChange without being a dep inside useEditor
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none p-4 min-h-72 text-text-primary",
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
  });

  // Re-sync value when it changes from outside (e.g. initial load or AI generation)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        `border border-brand-border rounded-brand-md overflow-hidden bg-background focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-colors ${className}`,
      )}
    >
      <MenuBar editor={editor} />
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
