// 'use client';
// import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from "react";
// import dynamic from "next/dynamic";
// import DOMPurify from "dompurify"; // NEW: sanitize HTML
// // import { marked } from "marked"; // Uncomment if your GPT output is Markdown

// const JoditEditor = dynamic(() => import("jodit-react").then(mod => mod.default), { ssr: false });

// interface Props {
//   id: string;
//   content: string;
//   type: "ques" | "ans" | "paper";
//   hide?: boolean;
//   height?: number;
//   prompt: any;
//   paperInfo: any;
//   onChange: (id: string, content: string, type: "ques" | "ans" | "paper") => void;
//   save: (id: string, content: string | null, type: any) => void;
// }

// const Editor = forwardRef(({ id, content, type, hide, height, onChange, save, prompt, paperInfo }: Props, ref) => {
//   const joditRef = useRef<any>(null); // wrapper ref
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(typeof window !== "undefined" && typeof document !== "undefined");
//   }, []);

//   useImperativeHandle(ref, () => ({
//     getContent: () => {
//       if (!isClient || !joditRef.current) return "";
//       return joditRef.current?.value || "";
//     },
//     setContent: (val: string) => {
//       if (isClient && joditRef.current) {
//         joditRef.current.value = val;
//         // keep parent in sync so value prop doesn’t overwrite it later
//         onChange(id, val, type);
//       }
//     },
//     focus: () => {
//       joditRef.current?.editor?.focus?.();
//     },
//   }));

//   const openUploadWidget = () => {
//     if (!isClient) return;

//     // @ts-ignore
//     const widget = window.cloudinary?.createUploadWidget(
//       {
//         cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//         uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_TEMP,
//         sources: ["local", "camera", "url"],
//         multiple: false,
//         cropping: false,
//         maxFileSize: 5000000,
//         context: {
//           caption: "qa-image",
//           alt: "qa-image",
//           authority: paperInfo?.authority,
//           field: paperInfo?.field,
//           course: paperInfo?.course,
//           season: paperInfo?.season,
//           term: paperInfo?.term,
//           set: paperInfo?.set,
//           subject: paperInfo?.subject,
//           year: paperInfo?.year,
//           timestamp: new Date().toISOString(),
//         },
//         // NEW: avoid undefineds in tags
//         tags: ["temporary", paperInfo?.field, paperInfo?.course, paperInfo?.authority, paperInfo?.season, paperInfo?.term, paperInfo?.set, paperInfo?.subject, paperInfo?.year].filter(Boolean),
//       },
//       (error: any, result: any) => {
//         if (!error && result && result.event === "success") {
//           const url = result.info.secure_url;
//           const alt = result.info.public_id;
//           const editor = joditRef.current?.editor; // use IJodit instance from wrapper
//           if (editor) {
//             editor.selection.insertHTML(
//               `<img src="${url}" style="width: 200px; height: auto;" alt="${alt.replace(/"/g, "&quot;")}" />`
//             );
//           }
//         }
//       }
//     );
//     widget?.open();
//   };

//   const config = {
//     readonly: false,
//     // NEW: respect passed height; fallback to previous min heights
//     minHeight: height ?? (type === "ques" ? 150 : 400),
//     placeholder: `Write ${type}...`,
//     autoHeight: true,
//     toolbarAdaptive: false,

//     // Clipboard/paste
//     askBeforePasteFromWord: false,
//     askBeforePasteHTML: false,
//     processPastedHTML: true,
//     pastePlain: false,

//     dragAndDrop: true,
//     dragAndDropElement: true,
//     pasteImages: false,

//     // IMPORTANT: isolate editor content from global CSS resets (Tailwind, etc.)
//     // Option A: Use iframe for isolation
//     iframe: true, // NEW
//     iframeStyle: `
//       html,body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
//       /* Restore list bullets and indentation */
//       ul, ol { margin: revert; padding-left: 1.75rem; list-style: revert; }
//       ul ul, ol ol { margin-left: 1.25rem; }
//       li { margin: 0.25rem 0; }
//     `,

//     // If you prefer not to use iframe, comment the iframe options above and use:
//     // style: `
//     //   .jodit-wysiwyg ul, .jodit-wysiwyg ol { margin: revert; padding-left: 1.75rem; list-style: revert; }
//     //   .jodit-wysiwyg ul ul, .jodit-wysiwyg ol ol { margin-left: 1.25rem; }
//     //   .jodit-wysiwyg li { margin: 0.25rem 0; }
//     // `,

//     buttons: [
//       "source", "|",
//       {
//         name: "gptGenerate",
//         iconURL: "https://cdn-icons-png.flaticon.com/512/4712/4712100.png",
//         tooltip: "Generate using ChatGPT",
//         exec: async (editor: any) => {
//           if (!isClient) return;

//           // Optional: If you want to use the passed IJodit instance, use it directly (don’t overwrite refs)
//           try {
//             const data = await prompt(id);
//             if (!data) return alert("Prompt data not found!");
//             const { q, marks } = data;
//             if (!q) return;

//             editor?.editor?.focus?.();
//             setTimeout(() => {
//               try {
//                 // FIXED malformed HTML and typo
//                 editor.selection?.insertHTML("<p><em>Generating...</em></p>");
//               } catch (e) {
//                 console.warn("Could not insert temporary text:", e);
//               }
//             }, 50);

//             const res = await fetch("/api/generate", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ prompt: q, paperInfo, marks }),
//             });

//             const payload = await res.json();
//             if (!payload.output) return alert(payload.error || "No output from ChatGPT!");

//             // If your output is Markdown, convert it:
//             // const rawHTML = marked.parse(payload.output);
//             const rawHTML = payload.output;

//             // Sanitize incoming HTML before injecting
//             const htmlContent = DOMPurify.sanitize(rawHTML, {
//               ALLOWED_ATTR: ["href", "src", "alt", "style", "title", "target", "rel", "colspan", "rowspan"],
//             });

//             // Replace editor content once with sanitized HTML (avoid per-char typing)
//             editor.value = htmlContent;

//             // Keep parent state in sync to avoid revert due to controlled prop
//             if (typeof onChange === "function") {
//               onChange(id, htmlContent, type);
//             }
//           } catch (err) {
//             console.error("GPT error:", err);
//             alert("Error generating content from ChatGPT.");
//           }
//         },
//       },
//       "bold", "italic", "underline", "strikethrough", "|",
//       "copyformat", "cut", "copy", "paste", "removeformat", "|",
//       {
//         name: "cloudinary",
//         iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png",
//         tooltip: "Upload to Cloudinary",
//         exec: () => openUploadWidget(),
//       },
//       "superscript", "subscript", "|",
//       "ul", "ol", "outdent", "indent", "|",
//       "font", "fontsize", "brush", "paragraph", "background", "|",
//       "align", "hr", "|",
//       "link", "unlink", "table",
//       "file", "video", "|",
//       "find", "selectall", "|",
//       "undo", "redo", "|",
//       "symbol", "emoji", "|",
//       "fullsize", "preview", "print", "|",
//       // Replace "clean" with a valid button if needed:
//       // "eraser" or "cleanHtml" depending on your Jodit version
//       "about"
//     ],
//   };

//   if (!isClient) return null;

//   return (
//     <div>
//       <JoditEditor
//         ref={(r) => { if (r) joditRef.current = r; }}
//         value={content}
//         config={config}
//         // Prefer onChange to keep parent in sync; keep onBlur if you want "save on blur"
//         onChange={(newContent) => onChange(id, newContent, type)}
//         onBlur={(newContent) => onChange(id, newContent, type)}
//       />
//     </div>
//   );
// });

// Editor.displayName = "Editor";
// export default Editor;