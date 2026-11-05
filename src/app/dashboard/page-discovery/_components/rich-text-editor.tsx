"use client"

import { CKEditor } from "@ckeditor/ckeditor5-react"
import {
  Autoformat,
  AutoImage,
  BlockQuote,
  Bold,
  ClassicEditor,
  type EditorConfig,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  Italic,
  Link,
  LinkImage,
  List,
  Paragraph,
  PasteFromOffice,
  PictureEditing,
  RemoveFormat,
  Strikethrough,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5"
import * as React from "react"

import "ckeditor5/ckeditor5.css"

// CKEditor 5 requires a license key. "GPL" covers development and open-source
// use; set NEXT_PUBLIC_CKEDITOR_LICENSE_KEY to a commercial key for production
// without touching this file.
const LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY || "GPL"

// Toolbar mirrors (and extends) the previous editor: headings, bold/italic/
// underline, links, bullet + numbered lists, blockquote, and clear-formatting.
const EDITOR_CONFIG: EditorConfig = {
  licenseKey: LICENSE_KEY,
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Link,
    List,
    BlockQuote,
    Autoformat,
    PasteFromOffice,
    RemoveFormat,
    // Images: render the page's fetched images (absolute URLs) and let the user
    // add more by URL. No upload adapter — images are referenced, not uploaded.
    ImageBlock,
    ImageInline,
    ImageToolbar,
    ImageCaption,
    ImageStyle,
    ImageResize,
    ImageTextAlternative,
    ImageInsertViaUrl,
    AutoImage,
    LinkImage,
    PictureEditing,
    Table,
    TableToolbar,
    // Preserve extra semantic markup the dedicated plugins don't model, so the
    // page comes through "as is" instead of being silently dropped on load.
    GeneralHtmlSupport,
  ],
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "|",
    "link",
    "insertImage",
    "insertTable",
    "blockQuote",
    "|",
    "bulletedList",
    "numberedList",
    "|",
    "removeFormat",
  ],
  image: {
    toolbar: [
      "imageStyle:inline",
      "imageStyle:block",
      "imageStyle:side",
      "|",
      "toggleImageCaption",
      "imageTextAlternative",
      "|",
      "linkImage",
    ],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
  htmlSupport: {
    // Keep these semantic wrappers/inline tags (without their framework classes,
    // which the backend already strips) so extracted content survives intact.
    // Only the element names are allowed (no attributes/classes/styles), so these
    // wrappers survive load without carrying framework noise.
    allow: [
      {
        name: /^(figure|figcaption|picture|source|section|article|aside|mark|abbr|sub|sup|time|small|cite|q)$/,
      },
    ],
  },
  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      {
        model: "heading1",
        view: "h1",
        title: "Heading 1",
        class: "ck-heading_heading1",
      },
      {
        model: "heading2",
        view: "h2",
        title: "Heading 2",
        class: "ck-heading_heading2",
      },
      {
        model: "heading3",
        view: "h3",
        title: "Heading 3",
        class: "ck-heading_heading3",
      },
    ],
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
  },
  placeholder: "Start writing…",
}

/**
 * Rich-text content editor built on CKEditor 5, replacing the old
 * contentEditable surface that relied on the deprecated `document.execCommand`
 * API (broken formatting / caret bugs in modern browsers).
 *
 * `initialData` seeds the editor once on mount — callers remount it (via a
 * React `key`) when a fresh page is fetched so a new seed takes effect. It is
 * deliberately NOT re-applied on every render, so typing never resets the
 * caret. `onChange` reports the current HTML (CKEditor-normalized) back to the
 * parent, which drives the live SEO score and the "Copy HTML" button.
 *
 * Loaded through next/dynamic with `ssr: false` — CKEditor touches the DOM at
 * import time and must only run in the browser.
 */
export function RichTextEditor({
  initialData,
  onChange,
}: {
  initialData: string
  onChange: (html: string) => void
}) {
  return (
    <div className="ck-editor-host">
      <CKEditor
        editor={ClassicEditor}
        config={EDITOR_CONFIG}
        data={initialData}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  )
}
