'use client';
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import EditableCard from "./EditableCard";
import Loading from "../components/loading";
import Protected from "../Protected";

type Subject = {
  id: string;
  subject: string;
  subCode: string;
  descr: string;
};

export default function ManageSubject() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchSubjects() {
      try {
        const subRef = collection(db, "subjects");
        const snapshot = await getDocs(subRef);
        const data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (mounted) {
          setSubjects(data);
          setFilteredSubjects(data); // initialize filtered list
        }
      } catch (error) {
        console.log("Error loading subjects", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSubjects();
    return () => { mounted = false };
  }, []);

  // Filter subjects based on search input
  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = subjects.filter(sub =>
      sub.subject.toLowerCase().includes(query) ||
      sub.subCode.toLowerCase().includes(query) ||
      sub.descr.toLowerCase().includes(query)
    );
    setFilteredSubjects(filtered);
  }, [search, subjects]);

  const handleSaved = (updated: Subject) => {
    setSubjects(prev => prev.map(sub => (sub.id === updated.id ? { ...sub, ...updated } : sub)));
    setFilteredSubjects(prev => prev.map(sub => (sub.id === updated.id ? { ...sub, ...updated } : sub)));
  };

  if (loading) return <Loading />;
  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-lg">No subjects found.</p>
      </div>
    );
  }

  return (<Protected>
    <div className="flex flex-col items-center w-full max-w-3xl px-2 gap-1 py-4 mx-auto">
      <h1 className="font-bold text-2xl w-full text-start">Manage Subjects</h1>

      {/* Search Input */}
      <div className="w-full mb-2">
        <input
          type="text"
          placeholder="Search by subject, code, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <p className="text-gray-500 w-full text-center py-4">No subjects match your search.</p>
      ) : (
        filteredSubjects.map(subject => (
          <EditableCard key={subject.id} subJect={subject} onSaved={handleSaved} />
        ))
      )}
    </div>
  </Protected>);
}
