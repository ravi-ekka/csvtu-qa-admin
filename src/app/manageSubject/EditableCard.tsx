'use client';
import { db } from "@/firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";

export default function EditableCard({ subJect, onSaved }: { subJect: { id: any; subject: string; subCode: any; descr: string }; onSaved: (updated: any) => void; }
) {
    const [isEditing, setIsEditing] = useState(false);
    const [subject, setSubject] = useState(subJect.subject);
    const [subCode, setSubCode] = useState(subJect.subCode);
    const [descr, setDescr] = useState(subJect.descr);
    const [saving, setSaving] = useState(false);
    async function handleSave() {
        setSaving(true);
        try {
            const ref = doc(db, "subjects", subJect.id);
            await updateDoc(ref,
                {
                    subject: subject,
                    subCode: subCode,
                    descr: descr,
                }
            );
            setIsEditing(false);
            onSaved({ id: subJect.id, subject, subCode, descr });
        }
        catch (error) {
            console.log(error);
        }
        finally {
            setSaving(false);
        }
    };
    const handleCancel = () => {
        setSubject(subJect.subject);
        setDescr(subJect.descr);
        setIsEditing(false);
    };
    return (
            <div className="card rounded w-full p-2  shadow-md bg-base-100 mx-auto">
                {
                    !isEditing ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-normal">{subJect.subject} {subJect.subCode ? "(" + subJect.subCode + ")" : ""}<small className="text-xs text-gray-500">({subJect.id})</small></h2>
                                    <p className="text-gray-600">{subJect.descr}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-sm btn-outline rounded bg-base-200"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) :
                        (
                            <div className="flex flex-col gap-3">
                                <label>
                                    <span className="text-sm font-bold">Subject Name </span>
                                    <small className="text-xs text-gray-500">
                                        (Document ID:<code className="bg-gray-100 px-1 rounded">{subJect.id}</code>)
                                    </small>
                                    <input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Subject Title"
                                    />
                                </label>
                                <label>
                                    <span className="text-sm font-bold">Subject Code</span>
                                    <input
                                        value={subCode}
                                        onChange={(e) => setSubCode(e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder="Subject Code"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-sm font-bold">Descr</span>
                                    <textarea
                                        value={descr}
                                        onChange={(e) => setDescr(e.target.value)}
                                        className="textarea textarea-bordered w-full"
                                        rows={2}
                                        placeholder="Add a short description..."
                                    />
                                </label>
                                <div className="flex gap-2 justify-end p-1 pb-0 pe-0">
                                    <button
                                        className="btn btn-soft btn-sm rounded"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        cancel
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm rounded"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "SaveChanges"}
                                    </button>
                                </div>
                            </div>
                        )
                }
            </div>
    );
}