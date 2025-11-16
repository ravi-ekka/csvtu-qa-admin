'use client';

import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useRef, useContext } from "react";
import Protected from "../Protected";
export default function CreateSubject() {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [subCode, setSubCode] = useState("");
  const [dsc, setDsc] = useState("");
  const [msg, setMsg] = useState("");
  const subjectInputRef = useRef<HTMLInputElement>(null);
  async function handleCreateSubject() {
    if (!subject.trim()) {
      setMsg("Please fill subject name");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "subjects"), {
        subject,
        subCode,
        descr: dsc,
        createdAt: serverTimestamp(),
      });
      setMsg("Subject Created!");
      setSubject("");
      setSubCode("");
      setDsc("");
      subjectInputRef.current?.focus();
    } catch (error) {
      setMsg("Fail To Create Subject");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  return (
    <Protected>
      <div className="flex justify-center mt-10 items-center w-full">
        <div className="card w-full max-w-lg bg-base-100">
          <form
            className="card-body"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateSubject();
            }}
          >
            <h2 className="card-title text-center">Create New Subject</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Subject Name *</span>
              </label>
              <input
                ref={subjectInputRef}
                type="text"
                aria-label="Subject Name"
                placeholder="Subject name"
                className="input input-bordered w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Subject Code</span>
              </label>
              <input
                type="text"
                aria-label="Subject Code"
                placeholder="Subject code"
                className="input input-bordered w-full"
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                aria-label="Description"
                className="textarea textarea-bordered w-full"
                placeholder="Description..."
                value={dsc}
                onChange={(e) => setDsc(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="form-control w-full text-center">
                {msg && (
                  <span
                    className={`px-2 py-1 rounded ${msg === "Subject Created!"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                      }`}
                  >
                    {msg}
                  </span>
                )}
              </div>
              <div className="form-control">
                <button
                  type="submit"
                  className="btn btn-primary whitespace-nowrap "
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Protected>);
}
