'use client';
import { db } from "@/firebase/firebaseConfig";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Protected from "../Protected";

export default function CreatePaper({ paperInfo }: any) {
    const router = useRouter();

    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [year, setYear] = useState('');
    const [season, setSeason] = useState('');
    const [authorities, setAuthorities] = useState<any>([]);
    const [authority, setAuthority] = useState('');
    const [courses, setCourses] = useState<any[]>([]);
    const [course, setCourse] = useState('');
    const [fields, setFields] = useState<any[]>([]);
    const [field, setField] = useState('');
    const [terms, setTerms] = useState<any[]>([]);
    const [term, setTerm] = useState('');
    const [seasons, setSeasons] = useState<any[]>([]);
    const [set, setSet] = useState('');
    const [descr, setDescr] = useState('');
    const [sets, setSets] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const setsData = [
        { "id": "", "name": "None" },
        { "id": "A", "name": "SET-A" },
        { "id": "B", "name": "SET-B" },
        { "id": "C", "name": "SET-C" },
        { "id": "D", "name": "SET-D" },
        { "id": "E", "name": "SET-E" },
    ];
    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            try {
                const AuthorityesSnap = await getDocs(query(collection(db, "education"), where("name", "==", "authority")));
                setAuthorities(JSON.parse(AuthorityesSnap.docs[0].data().authorities));
                if (authority) {
                    const coursesSnap = await getDocs(query(collection(db, "education"), where("authority", "==", authority)));
                    setCourses(JSON.parse(coursesSnap.docs[0].data().courses));
                    if (course) {
                        const Snap = await getDocs(query(collection(db, "courses"), where("course", "==", course,), where("authority", "==", "default")));
                        setFields((JSON.parse(Snap.docs[0].data().fields) || []));    // fields = { btech: [...], polytechnic: [...] }
                        setTerms(JSON.parse(Snap.docs[0].data().terms)); // terms = { btech: [...], polytechnic: [...] }
                        setSeasons(JSON.parse(Snap.docs[0].data().seasons));    // seasons = { btech: [...], polytechnic: [...] }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                if (mounted) setLoadingSubjects(false);
            }
        }
        fetchData();
        return () => { mounted = false; }
    }, [authority, course]);

    // Fetch subjects
    useEffect(() => {
        let mounted = true;
        async function fetchSubjects() {
            try {
                const snapshot = await getDocs(collection(db, "subjects"));
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                if (mounted) {
                    setSubjects(data);
                    if (paperInfo) {
                        setAuthority(paperInfo.authority);
                        setSubject(paperInfo.subject);
                        setYear(paperInfo.year);
                        setSeason(paperInfo.season);
                        setCourse(paperInfo.course);
                        setField(paperInfo.field);
                        setTerm(paperInfo.term);
                        setSet(paperInfo.set);
                        setDescr(paperInfo.descr);
                    }
                }
            } catch (error) {
                console.error("Error fetching subjects:", error);
            } finally {
                if (mounted) setLoadingSubjects(false);
            }
        }
        setSets(setsData);
        fetchSubjects();
        return () => { mounted = false; }
    }, []);

    const resetForm = () => {
        setAuthority('');
        setCourse('');
        setSubject('');
        setYear('');
        setSeason('');
        setField('');
        setTerm('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!subject) return setMessage({ type: 'error', text: 'Please select a subject.' });
        if (!year.trim()) return setMessage({ type: 'error', text: 'Please enter a year.' });
        if (!/^\d{4}$/.test(year.trim())) return setMessage({ type: 'error', text: 'Year must be 4 digits (e.g., 2025).' });

        setSaving(true);
        try {
            const selectedSubject = subjects.find(s => s.subject === subject);
            if (!selectedSubject) return setMessage({ type: "error", text: "Invalid subject selected." });

            if (paperInfo) {
                const Ref = doc(db, "papers", paperInfo.id);
                await setDoc(Ref, { authority, course, subject: selectedSubject.subject, year, season, field, term, set, descr, createdAt: serverTimestamp() }, { merge: true });
                setMessage({ type: "success", text: "Paper Updated!" });
            } else {
                const docRef = await addDoc(collection(db, "papers"), { authority, course, subject: selectedSubject.subject, year, season, field, term, set, descr, createdAt: serverTimestamp() });
                resetForm();
                setMessage({ type: "success", text: "Paper created successfully!" });
                router.push(`/editPQA?id=${docRef.id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Protected>
            <div className="max-w-3xl mx-auto mt-10">
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title">{paperInfo ? "Update Paper" : "Create New Paper"}</h2>
                        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 md:grid-cols-2 gap-4">
                            {/* authority */}
                            <div className="form-control col-span-2 w-full">
                                <label className="label"><span className="label-text">Authority</span></label>
                                <select className="select select-bordered w-full" value={authority} onChange={e => setAuthority(e.target.value)}>
                                    <option value={""}>Select authority...</option>
                                    {authorities?.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Course */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Course</span></label>
                                <select className="select select-bordered w-full" value={course} onChange={e => setCourse(e.target.value)}>
                                    <option>Select course...</option>
                                    {courses?.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Year</span></label>
                                <input type="text" inputMode="numeric" pattern="\d*" placeholder="e.g. 2025" value={year} onChange={e => setYear(e.target.value)} className="input input-bordered w-full" />
                            </div>

                            {/* Subject */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Subject</span></label>
                                {loadingSubjects ? (
                                    <select className="select select-bordered w-full" disabled><option>Loading subjects..</option></select>
                                ) : subjects.length === 0 ? (
                                    <div className="text-sm text-yellow-600">No subjects found. Create subjects first.</div>
                                ) : (
                                    <select className="select select-bordered w-full" value={subject} onChange={e => setSubject(e.target.value)}>
                                        <option>Select subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.subject}>{s.subject} ({s.subCode})</option>)}
                                    </select>
                                )}
                            </div>
                            {/* Season */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Season</span></label>
                                <select className="select select-bordered w-full" value={season} onChange={e => setSeason(e.target.value)}>
                                    <option>Select season...</option>
                                    {seasons?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* field */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Field</span></label>
                                <select className="select select-bordered w-full" value={field} onChange={e => setField(e.target.value)}>
                                    <option>Select Field...</option>
                                    <option value="common">Common</option>
                                    {fields.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}

                                </select>
                            </div>

                            {/* term */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">term</span></label>
                                <select className="select select-bordered w-full" value={term} onChange={e => setTerm(e.target.value)}>
                                    <option>Select term...</option>
                                    {
                                        terms.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))
                                    }
                                </select>
                            </div>
                            {/* SET */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">Set</span></label>
                                <select className="select select-bordered w-full" value={set} onChange={e => setSet(e.target.value)}>
                                    {
                                        sets.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))
                                    }
                                </select>
                            </div>

                            {/* description */}
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text">description</span></label>
                                <input type="text" placeholder="description..." value={descr} onChange={e => setDescr(e.target.value)} className="input input-bordered w-full" />
                            </div>


                            {/* Message */}
                            {message && (
                                <div className={`px-2 py-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-row justify-end items-center col-span-2">
                                <div className="flex gap-2">
                                    <button type="button" onClick={resetForm} className="btn bg-yellow-300" disabled={saving}>Reset</button>
                                    <button type="submit" className={`btn btn-success`} disabled={saving || loadingSubjects || subjects.length === 0}>
                                        {saving ? (paperInfo ? 'Updating' : 'Saving') : (paperInfo ? 'Update' : 'Save')}
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </Protected>
    );
}
