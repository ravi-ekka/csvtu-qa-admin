'use client';

import { useEffect, useState, useRef } from "react";
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
  where
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useSearchParams } from "next/navigation";
import Loading from "../components/loading";
import { cloudinaryDeleteImage } from "./utils/cloudinaryDeleteImage";
import getImagesUrl from "./utils/getImagesUrl";
import handleRemoveAddImages from "./utils/handleRemoveAddImages";
import getPublicIdFromUrl from "./utils/getPublicIdFromUrl";

// 🔹 Generate local temporary ID (for React keys)
function generateId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function QaTab({ paperInfo }: any) {
  const pid = useSearchParams().get("id");
  const [qas, setQas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const editorRefs = useRef<Record<string, any>>({});

  // 🔹 Fetch QAs for the selected paper
  useEffect(() => {
    if (!pid) return;

    async function fetchQas() {
      try {
        const qry = query(
          collection(db, "que-Ans"),
          where("paperId", "==", pid),
          orderBy("quesNo", "asc"),
          orderBy("subQuesNo", "asc")
        );
        const snapshot = await getDocs(qry);
        const result = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const qimageUrls = getImagesUrl(data.question);
          const aimageUrls = getImagesUrl(data.answare);
          const imageUrls = [...qimageUrls, ...aimageUrls];

          return {
            id: docSnap.id,         // Local stable key
            firestoreId: docSnap.id,  // Real Firestore document ID
            ques: data.question,
            ans: data.answare,
            quesNo: data.quesNo,
            subQuesNo: data.subQuesNo,
            marks: data.marks,
            imageUrls,
            hide: false,
            isSaved: true,
            isSaving: false,
            onChange: false,
          };
        });
        setQas(result);
      } catch (error) {
        console.error("Error fetching QA:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQas();
  }, [pid]);

  // 🔹 Add new blank QA
  const addQa = () => {
    setQas(prev => [
      ...prev,
      {
        id: generateId(),
        firestoreId: null,
        ques: "",
        ans: "",
        quesNo: prev.length + 1,
        subQuesNo: "",
        marks: null,
        imageUrls: [],
        hide: false,
        isSaved: false,
        isSaving: false,
        onChange: false
      }
    ]);
  };

  // 🔹 Toggle hide/show QA
  const toggleHide = (id: string) => {
    setQas(prev =>
      prev.map(q => (q.id === id ? { ...q, hide: !q.hide } : q))
    );
  };

  // 🔹 Handle text changes
  const onChange = (id: string, content: string, type: "ques" | "ans" | "paper") => {
    setQas(prev =>
      prev.map(q => (q.id === id ? { ...q, [type]: content, onChange: true } : q))
    );
  };

  // 🔹 Save QA to Firestore
  const handleSave = async (id: string) => {
    if (!pid) return;
    const qaToSave = qas.find((q) => q.id === id);
    if (!qaToSave) return;

    setQas(prev => prev.map(q => (q.id === id ? { ...q, isSaving: true } : q)));

    let ques = editorRefs.current[id + "_ques"]?.getContent()?.trim() || "";
    let ans = editorRefs.current[id + "_ans"]?.getContent()?.trim() || "";

    // 🔹 Handle image updates
    const currentUrls = [...getImagesUrl(ques), ...getImagesUrl(ans)];
    const previousUrls = qaToSave.imageUrls || [];

    async function updateImages() {
      const { uploadedResults = [], deletedResults = [] } =
        await handleRemoveAddImages(previousUrls, currentUrls, paperInfo);

      if (uploadedResults.length) {
        uploadedResults.forEach(({ oldUrl, newUrl }: any) => {
          ques = ques.replaceAll(oldUrl, newUrl);
          ans = ans.replaceAll(oldUrl, newUrl);
        });
      }

      const newUrls = uploadedResults.map((r: any) => r.newUrl);
      const deleteUrls = deletedResults.map((r: any) => r.urls);
      const combined = [...previousUrls, ...newUrls];
      const unique = [...new Set(combined)];
      return unique.filter((url) => !deleteUrls.includes(url));
    }

    const imageUrls = await updateImages();

    try {
      let firestoreId = qaToSave.firestoreId;

      if (!qaToSave.isSaved) {
        const docRef = await addDoc(collection(db, "que-Ans"), {
          paperId: pid,
          question: ques,
          answare: ans,
          quesNo: qaToSave.quesNo,
          subQuesNo: qaToSave.subQuesNo,
          marks: qaToSave.marks,
        });
        firestoreId = docRef.id;
      } else {
        await setDoc(doc(db, "que-Ans", firestoreId), {
          paperId: pid,
          question: ques,
          answare: ans,
          quesNo: qaToSave.quesNo,
          subQuesNo: qaToSave.subQuesNo,
          marks: qaToSave.marks,
        });
      }

      setQas(prev =>
        prev.map(q =>
          q.id === id
            ? {
                ...q,
                firestoreId,
                ques,
                ans,
                imageUrls,
                isSaving: false,
                isSaved: true,
                onChange: false,
              }
            : q
        )
      );
    } catch (err) {
      console.error("❌ Error saving QA:", err);
      setQas(prev => prev.map(q => (q.id === id ? { ...q, isSaving: false } : q)));
    }
  };

  // 🔹 Update question number
  const handleQuesNoChange = (id: string, newQuesNo: number) => {
    if (newQuesNo > 0) {
      setQas(prev =>
        prev
          .map(q =>
            q.id === id ? { ...q, quesNo: newQuesNo, onChange: true } : q
          )
          .sort((a, b) => (a.quesNo || 0) - (b.quesNo || 0))
      );
    }
  };

  // 🔹 Delete QA
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QA?")) return;
    try {
      const qa = qas.find(q => q.id === id);
      if (!qa) return alert("QA not found!");

      const allImages = [
        ...getImagesUrl(qa.ques),
        ...getImagesUrl(qa.ans),
      ].map(getPublicIdFromUrl).filter(Boolean);

      await Promise.all(allImages.map(cloudinaryDeleteImage));
      if (qa.firestoreId) await deleteDoc(doc(db, "que-Ans", qa.firestoreId));
      setQas(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // 🔹 Get question prompt
  const getPrompt = async (id: string) => {
    const qa = qas.find(q => q.id === id);
    const prompt = editorRefs.current[id + "_ques"]?.getContent();
    return { q: prompt, marks: qa?.marks };
  };

  if (loading) return <Loading />;

  // 🔹 Render
  return (
    <div className="w-full max-w-[900px] mx-auto">
      {qas.map((q) => (
        <div
          key={q.id}
          className="flex flex-col gap-4 mb-2 p-2 bg-base-100 rounded shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <label className="font-bold">Q.No</label>
              <input
                type="number"
                min={1}
                value={q.quesNo ?? ""}
                onChange={e => handleQuesNoChange(q.id, Number(e.target.value))}
                className="border-b w-10 text-center font-normal text-sm"
              />
              <input
                type="text"
                placeholder="(a)"
                value={q.subQuesNo ?? ""}
                onChange={e =>
                  setQas(prev =>
                    prev.map(p =>
                      p.id === q.id
                        ? { ...p, subQuesNo: e.target.value, onChange: true }
                        : p
                    )
                  )
                }
                className="border-b w-12 text-center font-normal text-sm"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label className="font-bold">Marks</label>
              <input
                type="number"
                min={0}
                value={q.marks ?? ""}
                onChange={e =>
                  setQas(prev =>
                    prev.map(p =>
                      p.id === q.id
                        ? { ...p, marks: Number(e.target.value), onChange: true }
                        : p
                    )
                  )
                }
                className="border-b w-10 text-center font-normal text-sm"
              />
              <button onClick={() => handleDelete(q.id)} className="btn btn-sm btn-error">
                Delete
              </button>
              <button onClick={() => toggleHide(q.id)} className="btn btn-sm btn-info">
                {q.hide ? "Show More" : "Hide Answer"}
              </button>
            </div>
          </div>

          {/* Question Editor */}
          <Editor
            ref={(r: any) => (editorRefs.current[q.id + "_ques"] = r)}
            id={q.id}
            content={q.ques}
            type="ques"
            hide={q.hide}
            height={100}
            onChange={onChange}
            save={handleSave}
            prompt={null}
            paperInfo={null}
          />

          {/* Answer Editor */}
          {!q.hide && (
            <>
              <span className="font-bold">Answer:</span>
              <Editor
                ref={(r: any) => (editorRefs.current[q.id + "_ans"] = r)}
                id={q.id}
                content={q.ans}
                type="ans"
                height={300}
                hide={q.hide}
                save={handleSave}
                onChange={onChange}
                prompt={getPrompt}
                paperInfo={paperInfo}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave(q.id)}
                  className={`btn btn-sm rounded ${
                    q.isSaving
                      ? "bg-gray-400"
                      : q.onChange
                      ? "bg-yellow-500"
                      : "btn-success"
                  }`}
                  disabled={q.isSaving}
                >
                  {!q.isSaving ? "Save" : "Saving..."}
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add New */}
      <div className="flex justify-center">
        <button
          onClick={addQa}
          className="btn btn-sm btn-info m-5 font-bold w-[80px]"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
