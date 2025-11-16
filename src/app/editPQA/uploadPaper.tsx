"use client";

import React, { useRef, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import getPublicIdFromUrl from "./utils/getPublicIdFromUrl";
import { cloudinaryDeleteImage } from "./utils/cloudinaryDeleteImage";

interface UploadPaperProps {
  id: any;
  paperInfo: {
    paperLink?: string;
    subject: string;
    course: string;
    field: string;
    season: string;
    term: string;
    set: string;
    year: string;
  };
}

export default function UploadPaper({ id, paperInfo }: UploadPaperProps) {
  const fileUrl= useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleSuccess = async (result: any) => {
    try {
      setUploading(true);
      setStatus("Processing upload...");

      const secureUrl =
        result?.info?.secure_url || result?.[0]?.info?.secure_url;

      if (!secureUrl) {
        console.error("Upload result missing secure_url:", result);
        setStatus("Error: Invalid upload result.");
        return;
      }

      // ✅ Delete previous Cloudinary file (from state or initial prop)
      const oldUrl = fileUrl.current || paperInfo?.paperLink;
      if (oldUrl) {
        const oldPublicId = getPublicIdFromUrl(oldUrl);
        if (oldPublicId) {
          try {
            await cloudinaryDeleteImage(oldPublicId);
            console.log("Old Cloudinary file deleted:", oldPublicId);
          } catch (err) {
            console.warn("Could not delete old file:", oldPublicId, err);
          }
        }
      }

      // ✅ Save new file URL to Firestore
      await setDoc(
        doc(db, "papers", id),
        { paperLink: secureUrl },
        { merge: true }
      );
      fileUrl.current=secureUrl;
      setStatus("Upload complete ✅");
      console.log("Uploaded file URL saved to Firestore:", secureUrl);
    } catch (error) {
      console.error("Upload handling failed:", error);
      setStatus("Error saving upload");
    } finally {
      setUploading(false);
    }
  };

  const handleError = (error: any) => {
    console.error("Cloudinary upload error:", error);
    setStatus("Upload failed ❌");
    setUploading(false);
  };

  // Guard for missing Cloudinary preset
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_Q_P) {
    console.error("Missing Cloudinary preset environment variable");
    return (
      <div className="p-4 text-red-500 text-center">
        ⚠️ Cloudinary upload preset not configured.
      </div>
    );
  }

  return (
    <div className="py-6 px-3 rounded-t w-full bg-base-100 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <h2 className="text-2xl font-bold p-3 text-nowrap">
          Upload Question Paper
        </h2>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_Q_P!}
          options={{
            sources: ["local", "google_drive", "url"],
            resourceType: "auto",
            clientAllowedFormats: [
              "pdf",
              "doc",
              "docx",
              "ppt",
              "pptx",
              "jpg",
              "png",
              "jpeg",
            ],
            folder: "question_papers",
            maxFiles: 1,
            maxFileSize: 10_000_000,
            context: {
              "caption": "question-paper",
              "alt": id,
              "paperId": id,
              "course": paperInfo.course,
              "field": paperInfo.field,
              "season": paperInfo.season,
              "term": paperInfo.term,
              "set": paperInfo.set,
              "subject": paperInfo.subject,
              "year": paperInfo.year,
            },
            tags: [
              paperInfo.subject,
              paperInfo.year,
              paperInfo.term,
              paperInfo.field,
              id,
            ],
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              disabled={uploading}
              className={`btn btn-primary btn-sm rounded ${uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          )}
        </CldUploadWidget>
      </div>

      {/* Upload status */}
      {status && (
        <p className="text-center text-sm text-gray-500 mt-2">{status}</p>
      )}

      {/* Display uploaded link */}
      <div className="flex justify-center overflow-scroll hide-scrollbar px-5 mt-2">
        {fileUrl.current|| paperInfo.paperLink ? (
          <a
            href={fileUrl.current || paperInfo.paperLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-wrap break-all text-center"
          >
            {fileUrl.current || paperInfo.paperLink}
          </a>
        ) : (
          <span className="text-gray-400 italic">No paper uploaded yet.</span>
        )}
      </div>
    </div>
  );
}
