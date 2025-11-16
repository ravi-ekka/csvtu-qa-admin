'use client';

import { useEffect, useRef, useState } from "react";
import Editor from "./Editor";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  // onSnapshot, // optional if you want realtime updates
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useSearchParams } from "next/navigation";
import Loading from "../components/loading";
import UploadPaper from "./uploadPaper";
import { cloudinaryDeleteImage } from "./utils/cloudinaryDeleteImage";
import getImagesUrl from "./utils/getImagesUrl";
import handleRemoveAddImages from "./utils/handleRemoveAddImages";
import getPublicIdFromUrl from "./utils/getPublicIdFromUrl";

// Generate a stable local ID for unsaved pages
function generateId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function PaperTab({ paperInfo }: any) {
  const pid = useSearchParams().get("id");
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0); // small counter to force re-render when needed

  // refs to hold mutable data without frequent re-renders
  const pagesRef = useRef<any[]>([]);
  const editorRefs = useRef<Record<string, any>>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const getPages = () => pagesRef.current;
  const refresh = () => setVersion(v => v + 1);

  // Fetch pages once (or enable onSnapshot for realtime)
  useEffect(() => {
    if (!pid) return;
    let mounted = true;

    async function fetchPages() {
      try {
        if (!pid) return;
        const q = query(collection(db, "papers", pid, "paper"), orderBy("pageNo", "asc"));
        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const imageUrls = getImagesUrl(data.pages || "");
          return {
            localId: docSnap.id,
            firestoreId: docSnap.id,
            paper: data.pages || "",
            imageUrls,
            pageNo: data.pageNo || 1,
            hide: false,
            isSaved: true,
            isSaving: false,
            onChange: false,
          };
        });

        if (!mounted) return;
        pagesRef.current = result;
        setLoading(false);
        refresh();
      } catch (err) {
        console.error("Error fetching pages:", err);
        pagesRef.current = [];
        setLoading(false);
        refresh();
      }
    }

    fetchPages();

    return () => { mounted = false; };
  }, [pid]);

  // Add new blank page
  const addPage = () => {
    const prev = getPages();
    const maxPageNo = prev.length > 0 ? Math.max(...prev.map(p => p.pageNo || 0)) : 0;
    const newPage = {
      localId: generateId(),
      firestoreId: null,
      paper: "",
      imageUrls: [],
      hide: false,
      isSaved: false,
      isSaving: false,
      onChange: false,
      pageNo: maxPageNo + 1,
    };
    pagesRef.current = [...prev, newPage].sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
    refresh();
  };

  // Toggle hide/show
  const toggleHide = (localId: string) => {
    pagesRef.current = getPages().map(p => p.localId === localId ? { ...p, hide: !p.hide } : p);
    refresh();
  };

  // onChange from Editor — mark page as changed and highlight Save button (yellow)
  const onChange = (localId: string, content?: string) => {
    pagesRef.current = getPages().map(p => p.localId === localId ? { ...p, paper: content ?? p.paper, onChange: true } : p);
    const btn = buttonRefs.current[localId];
    if (btn) btn.style.backgroundColor = "yellow";
    // No refresh to avoid re-render on every keystroke — UI will update when needed
  };

  // Page number modification
  const handlePageNoChange = (localId: string, newPageNo: number) => {
    if (newPageNo <= 0) return;
    pagesRef.current = getPages()
      .map(p => p.localId === localId ? { ...p, pageNo: newPageNo, onChange: true } : p)
      .sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
    refresh();
  };

  // Save page (create or update) — button becomes gray when saving, green on success
  const handleSave = async (localId: string, contentParam?: any, type?: any) => {
    if (!pid) return;
    const pageToSave = getPages().find(p => p.localId === localId);
    if (!pageToSave) return;

    // mark saving in ref and refresh to disable button
    pagesRef.current = getPages().map(p => p.localId === localId ? { ...p, isSaving: true } : p);
    refresh();

    // read content: prefer provided contentParam (from editor) or from ref
    // let data = typeof contentParam === "string" ? contentParam : pageToSave.paper || "";
    let data = editorRefs.current[localId].getContent();
    const currentUrls = getImagesUrl(data) || [];
    const previousUrls = pageToSave.imageUrls || [];

    async function updateImages() {
      const { uploadedResults = [], deletedResults = [] } =
        (await handleRemoveAddImages(previousUrls, currentUrls, paperInfo)) || {};

      if (uploadedResults.length) {
        uploadedResults.forEach(({ oldUrl, newUrl }: any) => {
          if (oldUrl && newUrl && typeof data === "string") {
            data = data.replaceAll(oldUrl, newUrl);
          }
        });
      }

      const newUrls = uploadedResults.map((r: any) => r.newUrl).filter(Boolean);
      const deleteUrls = deletedResults.flatMap((r: any) => r.urls || []);
      const combined = [...previousUrls, ...newUrls];
      const unique = [...new Set(combined)];
      return unique.filter((url) => !deleteUrls.includes(url));
    }

    const imageUrls = await updateImages();

    try {
      let firestoreId = pageToSave.firestoreId;

      // set button to gray (visual)
      const btn = buttonRefs.current[localId];
      if (btn) btn.style.backgroundColor = "lightgray";

      if (!pageToSave.isSaved) {
        const docRef = await addDoc(collection(db, "papers", pid, "paper"), {
          pageNo: pageToSave.pageNo,
          pages: data,
        });
        firestoreId = docRef.id;
      } else {
        await setDoc(doc(db, "papers", pid, "paper", firestoreId), {
          pageNo: pageToSave.pageNo,
          pages: data,
        });
      }

      // on success set green and update ref
      if (btn) btn.style.backgroundColor = "lightgreen";

      pagesRef.current = getPages().map(p => p.localId === localId ? {
        ...p,
        firestoreId,
        paper: data,
        imageUrls,
        isSaving: false,
        isSaved: true,
        onChange: false,
      } : p);

      refresh();
    } catch (err) {
      console.error("Error saving page:", err);
      // revert isSaving
      pagesRef.current = getPages().map(p => p.localId === localId ? { ...p, isSaving: false } : p);
      // optional: set button back to yellow to indicate unsaved
      const btn = buttonRefs.current[localId];
      if (btn) btn.style.backgroundColor = "yellow";
      refresh();
    }
  };

  // Delete page and related images
  const handleDelete = async (localId: string) => {
    if (!pid) return;
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      const page = getPages().find(p => p.localId === localId);
      if (!page) return alert("Page not found!");

      const imageUrls = getImagesUrl(page.paper || "") || [];
      const publicIds = imageUrls.map((url: string) => getPublicIdFromUrl(url)).filter(Boolean);
      await Promise.all(publicIds.map(cloudinaryDeleteImage));

      if (page.firestoreId) await deleteDoc(doc(db, "papers", pid, "paper", page.firestoreId));

      // remove refs
      delete editorRefs.current[localId];
      delete buttonRefs.current[localId];

      pagesRef.current = getPages().filter(p => p.localId !== localId);
      refresh();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <UploadPaper id={pid} paperInfo={paperInfo} />

      {getPages().map((p) => (
        <div key={p.localId} className="flex flex-col gap-4 mb-2 p-1 bg-base-100 rounded-b shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="font-bold">Page</span>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(p.localId)} className="btn btn-sm btn-error">Delete</button>
              <button onClick={() => toggleHide(p.localId)} className="btn btn-sm btn-info">
                {p.hide ? "Show More" : "Show Less"}
              </button>
            </div>
          </div>

          <Editor
            id={p.localId}
            content={p.paper}
            type="paper"
            hide={p.hide}
            height={400}
            onChange={(localId: string, content: string) => onChange(localId, content)}
            save={(localId: string, content: any, type: any) => handleSave(localId, content, type)}
            paperInfo={paperInfo}
            prompt={undefined}
            ref={(r: any) => { if (r) editorRefs.current[p.localId] = r; }}
          />

          {!p.hide && (
            <div className="flex items-center justify-between">
              <div className="flex items-center font-medium">
                <span className="text-nowrap mr-1">Page No</span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Page No"
                  value={p.pageNo ?? ""}
                  onChange={(e) => handlePageNoChange(p.localId, Number(e.target.value))}
                  className="border-b-1 w-15 text-center font-normal text-[13px]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  ref={(el: any) => (buttonRefs.current[p.localId] = el)}
                  onClick={() => handleSave(p.localId, null, null)}
                  className={`btn btn-sm rounded ${p.onChange ? "bg-yellow-500" : "btn-success"}`}
                  disabled={p.isSaving}
                >
                  {!p.isSaving ? "Save" : "Saving..."}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-center">
        <button onClick={addPage} className="btn btn-sm btn-info m-5 font-bold w-[70px] text-nowrap">+ Add</button>
      </div>
    </div>
  );
}
