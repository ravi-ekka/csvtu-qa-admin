// 'use client';
// import React, { useEffect, useRef } from "react";
// import dynamic from "next/dynamic";
// const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
// import { cloudinaryDeleteImage } from "./utils/cloudinaryDeleteImage";


// interface Props {
//   id: string;
//   content: string;
//   type: "ques" | "ans" | "paper";
//   hide?: boolean;
//   height?: number;
//   onChange: (id: string, content: string, type: "ques" | "ans" | "paper") => void;
//   save: (id: string, content: string | null) => void;
// }

// export default function Editor({ id, content, type, hide, height, onChange, save }: Props) {
//   const editorRef = useRef<any>(null);

//   useEffect(() => {
//     const editor = editorRef.current?.editor;
//     if (!editor) return;

//     const observer = new MutationObserver((mutations) => {
//       for (const mutation of mutations) {
//         mutation.removedNodes.forEach((node) => {
//           if (node.nodeName === "IMG") {
//             const el = node as HTMLImageElement;
//             const pid =
//               el.dataset?.publicId ||
//               (el.src.match(/\/upload\/v\d+\/([^."']+)/) ? el.src.match(/\/upload\/v\d+\/([^."']+)/)![1] : null);
//             if (pid) cloudinaryDeleteImage(pid);
//           }
//         });
//       }
//     });

//     observer.observe(editor, { childList: true, subtree: true });
//     return () => observer.disconnect();
//   }, []);

//   const openUploadWidget = () => {
//     // @ts-ignore
//     const widget = window.cloudinary?.createUploadWidget(
//       {
//         cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//         uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
//         sources: ["local", "camera", "url"],
//         multiple: false,
//         cropping: false,
//         folder: "qa_uploads",
//         maxFileSize: 5000000, // 5MB
//       },
//       (error: any, result: any) => {
//         if (!error && result && result.event === "success") {
//           const url = result.info.secure_url;
//           const editor: any = editorRef.current;
//           if (editor) {
//             editor.selection.insertHTML(`<img src="${url}" alt="Uploaded" />`);
//           }
//           setTimeout(() => {
//             save(id, editor.getHTML());
//           }, 10000);

//         }
//       }
//     );
//     widget.open();
//   };
//   const config = {
//     readonly: false,
//     minHeight: type === "ques" ? 150 : 400,
//     autoHeight: true,
//     askBeforePasteFromWord: false, // ✅ allows direct Word formatting paste
//     pastePlainText: false,
//     uploader: { insertImageAsBase64URI: false },
//     buttons: [
//       "source", "|",
//       {
//         name: "cloudinary",           // internal name
//         iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png", // optional icon
//         tooltip: "Upload to Cloudinary",
//         exec: function (editor: any) {
//           // Your custom function
//           openUploadWidget();
//         }
//       },
//       "bold", "italic", "underline", "strikethrough", "|",
//       "superscript", "subscript", "|",
//       "ul", "ol", "outdent", "indent", "|",
//       "font", "fontsize", "brush", "paragraph", "background", "|",
//       "align", "hr", "|",
//       "link", "unlink", "table",
//       , "file", "video", "|",
//       "find", "selectall", "|",
//       "undo", "redo", "|",
//       "symbol", "emoji", "|",
//       "copyformat", "cut", "copy", "paste", "removeformat", "|",
//       "fullsize", "preview", "print", "|",
//       "about", "clean",
//     ],
//   }
//   var cc:any;
//   function save1() {
//     try{
//       console.log(editorRef.current);
//     }
//     catch(error)
//     {
//       console.log(error);
//     }
//   }

//   return (
//     <div>
//       <JoditEditor
//         ref={editorRef}
//         value={content}
//         config={config}
//         onBlur={(newContent) => onChange(id, newContent, type)}
//       />
//       <div className="flex justify-end">
//         <button
//           onClick={() => save1()}
//           className={`btn btn-sm rounded`}
//         >
//           Save
//         </button>
//       </div>
//     </div>
//   );
// }
