'use client';

import { useEffect, useState } from "react";
import Editor from "./Editor";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useSearchParams } from "next/navigation";
import Loading from "../components/loading";
import UploadPaper from "./uploadPaper";
import { cloudinaryDeleteImage } from "./utils/cloudinaryDeleteImage";
import getImagesUrl from "./utils/getImagesUrl";
import handleRemoveAddImages from "./utils/handleRemoveAddImages";
import getPublicIdFromUrl from "./utils/getPublicIdFromUrl";

// 🔹 Generate local unique ID for unsaved pages
function generateId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function PaperTab({ paperInfo }: any) {
  const pid = useSearchParams().get("id");
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch Firestore pages in real-time
  // useEffect(() => {
  //   if (!pid) return;
  //   const q = query(collection(db, "papers", pid, "paper"), orderBy("pageNo", "asc"));
  //   const unsub = onSnapshot(
  //     q,
  //     (snapshot) => {
  //       const result = snapshot.docs.map((docSnap: any) => {
  //         const data = docSnap.data();
  //         const imageUrls = getImagesUrl(data.pages || "");
  //         return {
  //           // ⚠️ Keep a separate `localId` key for React (stable)
  //           localId: docSnap.id,
  //           firestoreId: docSnap.id,
  //           paper: data.pages || "",
  //           imageUrls,
  //           pageNo: data.pageNo || 1,
  //           hide: false,
  //           isSaved: true,
  //           isSaving: false,
  //           onChange: false,
  //         };
  //       });
  //       setPages(Array.isArray(result) ? result : []);
  //       setLoading(false);
  //     },
  //     (error) => {
  //       console.error("Error fetching pages:", error);
  //       setPages([]);
  //       setLoading(false);
  //     }
  //   );
  //   return () => unsub();
  // }, [pid]);
  useEffect(() => {
    if (!pid) return;

    async function fetchPages() {
      try {
        if (!pid) return;
        const q = query(collection(db, "papers", pid, "paper"), orderBy("pageNo", "asc"));
        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const imageUrls = getImagesUrl(data.pages || "");
          return {
            localId: docSnap.id, // 🔹 Use this as stable React key
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
        setPages(result);
      } catch (error) {
        console.error("Error fetching pages:", error);
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, [pid]);


  // 🔹 Add a new blank page
  const addPage = () => {
    setPages((prev) => {
      const maxPageNo = prev.length > 0 ? Math.max(...prev.map((p) => p.pageNo || 0)) : 0;

      return [
        ...prev,
        {
          localId: generateId(), // stays constant until manual delete
          firestoreId: null,
          paper: "",
          imageUrls: [],
          hide: false,
          isSaved: false,
          isSaving: false,
          onChange: false,
          pageNo: maxPageNo + 1,
        },
      ].sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
    });
  };

  // 🔹 Toggle show/hide
  const toggleHide = (localId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.localId === localId ? { ...p, hide: !p.hide } : p))
    );
  };

  // 🔹 Handle editor content changes
  const onChange = (localId: string, content: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.localId === localId ? { ...p, paper: content, onChange: true } : p
      )
    );
  };

  // 🔹 Page number modification
  const handlePageNoChange = (localId: string, newPageNo: number) => {
    if (newPageNo > 0) {
      setPages((prev) => {
        const updated = prev.map((p) =>
          p.localId === localId ? { ...p, pageNo: newPageNo, onChange: true } : p
        );
        return updated.sort((a, b) => (a.pageNo || 0) - (b.pageNo || 0));
      });
    }
  };

  // 🔹 Save page (create or update)
  const handleSave = async (localId: string, content: any, type: any) => {
    if (!pid) return;

    const pageToSave = pages.find((p) => p.localId === localId);
    if (!pageToSave) return;

    setPages((prev) =>
      prev.map((p) => (p.localId === localId ? { ...p, isSaving: true } : p))
    );

    let data = content || pageToSave.paper || "";
    const c_urls = getImagesUrl(data) || [];
    const p_urls = pageToSave.imageUrls || [];

    async function updateImages() {
      const { uploadedResults = [] } =
        (await handleRemoveAddImages(p_urls, c_urls, paperInfo)) || {};

      if (uploadedResults.length) {
        uploadedResults.forEach(({ oldUrl, newUrl }: any) => {
          if (oldUrl && newUrl && typeof data === "string") {
            data = data.replaceAll(oldUrl, newUrl);
          }
        });
      }

      const newUrls = uploadedResults
        .map(({ newUrl }: any) => newUrl)
        .filter(Boolean);
      const combined = [...newUrls, ...p_urls];
      return [...new Set(combined)];
    }

    const imageUrls = await updateImages();

    try {
      let firestoreId = pageToSave.firestoreId;

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

      // ✅ Update state without changing `localId` (no rerender reset)
      setPages((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? {
              ...p,
              firestoreId,
              imageUrls,
              isSaving: false,
              isSaved: true,
              onChange: false,
            }
            : p
        )
      );
    } catch (err) {
      console.error("Error saving page:", err);
      setPages((prev) =>
        prev.map((p) => (p.localId === localId ? { ...p, isSaving: false } : p))
      );
    }
  };

  // 🔹 Delete page and related images
  const handleDelete = async (localId: string) => {
    if (!pid) return;
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      const page = pages.find((p) => p.localId === localId);
      if (!page) return alert("Page not found!");
      const imageUrls = getImagesUrl(page.paper || "") || [];
      const publicIds = imageUrls
        .map((url: string) => getPublicIdFromUrl(url))
        .filter(Boolean);
      await Promise.all(publicIds.map(cloudinaryDeleteImage));

      if (page.firestoreId)
        await deleteDoc(doc(db, "papers", pid, "paper", page.firestoreId));

      setPages((prev) => prev.filter((p) => p.localId !== localId));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // 🔹 Loading UI
  if (loading) return <Loading />;

  // 🔹 Main render
  return (
    <div className="w-full max-w-[900px] mx-auto">
      <UploadPaper id={pid} paperInfo={paperInfo} />
      {Array.isArray(pages) &&
        pages.map((p) => (

          <div
            key={p.localId} // ✅ stable key that never changes after save
            className="flex flex-col gap-4 mb-2 p-1 bg-base-100 rounded-b shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">Page</span>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(p.localId)} className="btn btn-sm btn-error">
                  Delete
                </button>
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
              onChange={onChange}
              save={handleSave}
              paperInfo={undefined}
              prompt={undefined}
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
                    onChange={(e) =>
                      handlePageNoChange(p.localId, Number(e.target.value))
                    }
                    className="border-b-1 w-15 text-center font-normal text-[13px]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(p.localId, null, null)}
                    className={`btn btn-sm rounded ${p.onChange ? "bg-yellow-500" : "btn-success"
                      }`}
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
        <button
          onClick={addPage}
          className="btn btn-sm btn-info m-5 font-bold w-[70px] text-nowrap"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
