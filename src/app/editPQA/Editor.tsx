'use client';
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { lineHeight } from "jodit/esm/plugins/line-height/line-height";


const JoditEditor = dynamic(() => import("jodit-react").then(mod => mod.default), { ssr: false });

interface Props {
  id: string;
  content: string;
  type: "ques" | "ans" | "paper";
  hide?: boolean;
  height?: number;
  prompt: any;
  paperInfo: any;
  onChange: any;
  save: (id: string, content: string | null, type: any) => void;
}

const Editor = forwardRef(({
  id, content, type, hide, height, onChange, save, prompt, paperInfo
}: Props, ref) => {

  const editorRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ Only enable DOM-related actions after mount
  useEffect(() => {
    setIsClient(typeof window !== "undefined" && typeof document !== "undefined");
  }, []);

  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (!isClient || !editorRef.current) return "";
      return editorRef.current.value; // ✅ Returns HTML, not plain text
    },

    setContent: (val: string) => {
      if (isClient && editorRef.current) editorRef.current.value = val;
    },
    focus: () => {
      editorRef.current?.editor?.focus?.();
    },
  }));

  const openUploadWidget = () => {
    if (!isClient) return;

    // @ts-ignore
    const widget = window.cloudinary?.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TEMP,
        sources: ["local", "camera", "url"],
        multiple: false,
        cropping: false,
        maxFileSize: 5000000,
        context: {
          caption: "qa-image",
          alt: "qa-image",
          authority: paperInfo?.authority,
          field: paperInfo?.field,
          course: paperInfo?.course,
          season: paperInfo?.season,
          term: paperInfo?.term,
          set: paperInfo?.set,
          subject: paperInfo?.subject,
          year: paperInfo?.year,
          timestamp: new Date().toISOString(),
        },
        tags: ["temporary", paperInfo.field, paperInfo.course, paperInfo.authority, paperInfo.season, paperInfo.term, paperInfo.set, paperInfo.subject, paperInfo.year]
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          const alt = result.info.public_id;
          const editor: any = editorRef.current;
          if (editor) {
            editor.selection.insertHTML(
              `<img src="${url}" style="width: 200px; height: auto;" alt="${alt}" />`
            );
          }
        }
      }
    );
    widget.open();
  };

  const config = {
    toolbar: !hide,
    readonly: false,
    minHeight: type === "ques" ? 130 : 400,
    placeholder: "...",
    autoHeight: true,
    toolbarAdaptive: false,
    askBeforePasteFromWord: false,
    askBeforePasteHTML: false,
    processPastedHTML: true,
    pastePlain: false,
    dragAndDrop: true,
    dragAndDropElement: true,
    pasteImages: false,
    iframe: true,
    iframeStyle: `
    /* Keep default Jodit editor base styles */
    html,body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 18px;
      line-height: 1;
      padding:0px 0px 2px 0px;
    }

    /* ✅ Restore bullets and indentation */
    ul, ol {
      margin: revert;
      padding-left: 1.75rem;
      list-style: revert;
    }

    /* ✅ Restore table borders */
    table, th, td {
      border: 1px solid #ccc;
      border-collapse: collapse;
    }
    th, td {
      padding: 6px 10px;
    }

    /* ✅ Your custom rule */
    p {
      margin: 0;
    }
  `,


    buttons: [
      "source", "|",
      {
        name: "cloudinary",
        iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png",
        tooltip: "Upload to Cloudinary",
        exec: (editor: any) => {
          editorRef.current = editor;
          openUploadWidget();
        },
      },
      {
        name: "gptGenerate",
        iconURL: "https://cdn-icons-png.flaticon.com/512/4712/4712100.png",
        tooltip: "Generate using ChatGPT",
        exec: async (editor: any) => {
          if (!isClient) return;
          editorRef.current = editor;

          const data = await prompt(id);
          if (!data) return alert("Prompt data not found!");
          const { q, marks } = data;
          if (!q) return;

          // ✅ Safely focus editor before writing anything
          editorRef.current?.editor?.focus?.();
          setTimeout(() => {
            try {
              editorRef.current.selection?.insertHTML("<p>Genrating...</em></p>");
            } catch (e) {
              console.warn("⚠️ Could not insert temporary text:", e);
            }
          }, 100);

          try {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: q, paperInfo, marks }),
            });

            const data = await res.json();
            console.log("🔹 GPT Response:", data);

            if (!data.output) return alert(data.error || "No output from ChatGPT!");

            // const htmlContent = marked.parse(data.output);
            const htmlContent = data.output;
            const tempDiv: any = document.createElement("div");
            tempDiv.innerHTML = htmlContent;
            const textToType = tempDiv.innerText;

            // ✅ Ensure editor is focused again before inserting generated text
            editorRef.current?.editor?.focus?.();
            const selection = editorRef.current.selection;

            if (!selection) {
              console.error("⚠️ No selection available in editor.");
              return;
            }

            // Remove temporary text safely
            editorRef.current.value = "";

            // let i = 0;
            // const typingSpeed = 15;
            // const typeNextChar = () => {
            //   try {
            //     if (i < textToType.length) {
            //       selection.insertHTML(textToType[i]);
            //       i++;
            //       setTimeout(typeNextChar, typingSpeed);
            //     } else {
            //       // Replace plain typed text with formatted HTML
            //       editorRef.current.value = htmlContent;
            //     }
            //   } catch (err) {
            //     console.error("⚠️ Typing insert error:", err);
            //   }
            // };
            // typeNextChar();
            editorRef.current.value = htmlContent;

          } catch (err) {
            console.error("❌ GPT error:", err);
            alert("Error generating content from ChatGPT.");
          }
        },

      },
      "bold", "italic", "underline", "strikethrough", "|",
      "copyformat", "cut", "copy", "paste", "removeformat", "|",
      "superscript", "subscript", "|",
      "ul", "ol", "outdent", "indent", "|",
      "font", "fontsize", "brush", "paragraph", "background", "|",
      "align", "hr", "|",
      "link", "unlink", "table",
      "file", "video", "|",
      "find", "selectall", "|",
      "undo", "redo", "|",
      "symbol", "emoji", "|",
      "fullsize", "preview", "print", "|",
      "about", "clean",
    ],
  };

  if (!isClient) return null; // ✅ prevent SSR crash entirely

  return (
    <div>
      <JoditEditor
        ref={(r) => { if (r) editorRef.current = r; }}
        value={content}
        config={config}
        onChange={() => {
          onChange(id)
        }
        }
      // onBlur={(newContent) => onChange(id, newContent, type)}
      />
    </div>
  );
});

Editor.displayName = "Editor";
export default Editor;
