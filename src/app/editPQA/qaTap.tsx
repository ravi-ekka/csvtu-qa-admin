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

// Generate local temporary ID
function generateId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function QaTab({ paperInfo }: any) {
  const pid = useSearchParams().get("id");

  // For minimal re-rendering
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0); // force UI refresh manually

  // Refs to avoid re-render
  const qasRef = useRef<any[]>([]);
  const editorRefs = useRef<Record<string, any>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Helpers
  const getQas = () => qasRef.current;
  const refresh = () => setVersion(v => v + 1);

  // Fetch QAs
  useEffect(() => {
    if (!pid) return;
    let mounted = true;

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
            id: docSnap.id,
            firestoreId: docSnap.id,
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

        if (!mounted) return;
        qasRef.current = result;
        setLoading(false);
        refresh();
      } catch (error) {
        console.error("Error fetching QA:", error);
        setLoading(false);
      }
    }

    fetchQas();
    return () => {
      mounted = false;
    };
  }, [pid]);

  // Add new QA
  const addQa = () => {
    const newQa = {
      id: generateId(),
      firestoreId: null,
      ques: "",
      ans: "",
      quesNo: getQas().length + 1,
      subQuesNo: "",
      marks: null,
      imageUrls: [],
      hide: false,
      isSaved: false,
      isSaving: false,
      onChange: false,
    };
    qasRef.current.push(newQa);
    refresh();
  };

  const toggleHide = (id: string) => {
    const q = getQas().find(x => x.id === id);
    if (q) q.hide = !q.hide;
    refresh();
  };

  // --- 🔹 Optimized Input Updates: NO re-render ---
  const handleMarksChange = (id: string, value: number) => {
    const qa = getQas().find(q => q.id === id);
    if (!qa) return;
    qa.marks = value;
    qa.onChange = true;

    // Change save button color instantly (DOM-level)
    const btn = buttonRefs.current[id];
    if (btn) btn.style.backgroundColor = "yellow";
  };

  const handleSubQuesChange = (id: string, value: string) => {
    const qa = getQas().find(q => q.id === id);
    if (!qa) return;
    qa.subQuesNo = value;
    qa.onChange = true;

    const btn = buttonRefs.current[id];
    if (btn) btn.style.backgroundColor = "yellow";
  };

  const handleQuesNoChange = (id: string, value: number) => {
    const qa = getQas().find(q => q.id === id);
    if (!qa) return;
    qa.quesNo = value;
    qa.onChange = true;
    const btn = buttonRefs.current[id];
    if (btn) btn.style.backgroundColor = "yellow";
  };

  // --- 🔹 Save QA ---
  const handleSave = async (id: string) => {
    if (!pid) return;
    const qaToSave = getQas().find((q) => q.id === id);
    if (!qaToSave) return;

    // mark saving (only visually disable button)
    const targetBtn = buttonRefs.current[id];
    if (targetBtn) {
      targetBtn.textContent = "Saving...";
      targetBtn.disabled = true;
      targetBtn.style.backgroundColor = "gray";
    }

    let ques = editorRefs.current[id + "_ques"]?.getContent()?.trim() || "";
    let ans = editorRefs.current[id + "_ans"]?.getContent()?.trim() || "";

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

      // ✅ update ref only, no refresh
      qasRef.current = getQas().map(q => q.id === id ? {
        ...q,
        firestoreId,
        ques,
        ans,
        isSaved: true,
        isSaving: false,
        onChange: false,
      } : q);

      // ✅ update button UI directly (no full rerender)
      if (targetBtn) {
        targetBtn.textContent = "Saved";
        targetBtn.disabled = false;
        targetBtn.style.backgroundColor = "lightgreen";
      }

    } catch (err) {
      console.error("❌ Error saving QA:", err);
      if (targetBtn) {
        targetBtn.textContent = "Error";
        targetBtn.disabled = false;
        targetBtn.style.backgroundColor = "red";
      }
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QA?")) return;
    const qa = getQas().find(q => q.id === id);
    if (!qa) return;

    const allImages = [...getImagesUrl(qa.ques), ...getImagesUrl(qa.ans)]
      .map(getPublicIdFromUrl)
      .filter(Boolean);

    await Promise.all(allImages.map(cloudinaryDeleteImage));
    if (qa.firestoreId) await deleteDoc(doc(db, "que-Ans", qa.firestoreId));

    delete editorRefs.current[id + "_ques"];
    delete editorRefs.current[id + "_ans"];
    delete buttonRefs.current[id];

    qasRef.current = getQas().filter(q => q.id !== id);
    refresh();
  };

  const getPrompt = async (id: string) => {
    const qa = getQas().find(q => q.id === id);
    const prompt = editorRefs.current[id + "_ques"]?.getContent();
    return { q: prompt, marks: qa?.marks };
  };

  if (loading) return <Loading />;

  // ✅ Render UI
  return (
    <div className="w-full max-w-[900px] mx-auto">
      {getQas().map((q) => (
        <div
          key={q.id}
          className="flex flex-col gap-4 mb-2 p-2 bg-base-100 rounded shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <label className="font-bold">Q.No</label>
              <input
                ref={(el: any) => (inputRefs.current[q.id + "_quesNo"] = el)}
                type="number"
                min={1}
                defaultValue={q.quesNo ?? ""}
                onInput={e => handleQuesNoChange(q.id, Number(e.currentTarget.value))}
                className="border-b w-10 text-center font-normal text-sm"
              />
              <input
                ref={(el: any) => (inputRefs.current[q.id + "_subQues"] = el)}
                type="text"
                placeholder="a"
                defaultValue={q.subQuesNo ?? ""}
                onInput={e => handleSubQuesChange(q.id, e.currentTarget.value)}
                className="border-b w-12 text-center font-normal text-sm"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label className="font-bold">Marks</label>
              <input
                ref={(el: any) => (inputRefs.current[q.id + "_marks"] = el)}
                type="number"
                min={0}
                defaultValue={q.marks ?? ""}
                onInput={e => handleMarksChange(q.id, Number(e.currentTarget.value))}
                className="border-b w-10 text-center font-normal text-sm"
              />
              <button onClick={() => handleDelete(q.id)} className="btn btn-sm btn-error">
                Delete
              </button>
              <button onClick={() => toggleHide(q.id)} className="btn btn-sm btn-info">
                {q.hide ? "show More" : "show less"}
              </button>
            </div>
          </div>

          {/* Editors */}
          <Editor
            ref={(r: any) => (editorRefs.current[q.id + "_ques"] = r)}
            id={q.id}
            content={q.ques}
            type="ques"
            hide={q.hide}
            height={100}
            onChange={() => handleMarksChange(q.id, q.marks)} // reuse to mark dirty
            save={handleSave}
            prompt={null}
            paperInfo={null}
          />

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
                onChange={() => handleMarksChange(q.id, q.marks)}
                prompt={getPrompt}
                paperInfo={paperInfo}
              />
              <div className="flex justify-end">
                <button
                  ref={(el: any) => (buttonRefs.current[q.id] = el)}
                  onClick={() => handleSave(q.id)}
                  className={`btn btn-sm rounded ${q.isSaving
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
