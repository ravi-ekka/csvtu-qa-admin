'use client';
import { db } from "@/firebase/firebaseConfig";
import { collection, doc, getDocs, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "../components/loading";
import Protected from "../Protected";

interface Paper {
  id: string;
  subject: string;
  term: string;
  season: string;
  year: string | number;
  authority: string;
  course: string;
  field: string;
}

export default function ManagePaper() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [authorities, setAuthorities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  // const [authority, setAuthority] = useState(() => localStorage.getItem("authority") || "");
  // const [course, setCourse] = useState(() => localStorage.getItem("course") || "");
  // const [field, setField] = useState(() => localStorage.getItem("field") || "");
  // const [term, setTerm] = useState(() => localStorage.getItem("term") || "");

  const [authority, setAuthority] = useState("");
  const [course, setCourse] = useState("");
  const [field, setField] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthority(localStorage.getItem("authority") || "");
      setCourse(localStorage.getItem("course") || "");
      setField(localStorage.getItem("field") || "");
      setTerm(localStorage.getItem("term") || "");
    }
  }, []);


  // Remember dropdowns after refresh
  useEffect(() => localStorage.setItem("authority", authority), [authority]);
  useEffect(() => localStorage.setItem("course", course), [course]);
  useEffect(() => localStorage.setItem("field", field), [field]);
  useEffect(() => localStorage.setItem("term", term), [term]);

  // 🔹 Fetch Dropdown Data
  useEffect(() => {
    async function fetchEducationData() {
      try {
        const authoritySnap = await getDocs(query(collection(db, "education"), where("name", "==", "authority")));
        const authorityList = JSON.parse(authoritySnap.docs[0].data().authorities);
        setAuthorities(authorityList);

        if (authority) {
          const courseSnap = await getDocs(query(collection(db, "education"), where("authority", "==", authority)));
          setCourses(JSON.parse(courseSnap.docs[0].data().courses));

          if (course) {
            const fieldSnap = await getDocs(query(collection(db, "courses"), where("course", "==", course)));
            const docData = fieldSnap.docs[0].data();
            setFields(JSON.parse(docData.fields) || []);
            setTerms(JSON.parse(docData.terms) || []);
          }
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    }
    fetchEducationData();
  }, [authority, course]);

  // 🔹 Fetch papers according to dropdown selections
  useEffect(() => {
    async function fetchFilteredPapers() {
      try {
        setLoading(true);

        const papersRef = collection(db, "papers");

        const conditions: any[] = [];
        if (authority) conditions.push(where("authority", "==", authority));
        if (course) conditions.push(where("course", "==", course));
        if (field) conditions.push(where("field", "==", field));
        if (term) conditions.push(where("term", "==", term));

        // 🔹 Apply filters and sorting
        let q;
        if (conditions.length > 0) {
          q = query(papersRef, ...conditions, orderBy("subject"), orderBy("year", "desc"));
        } else {
          q = query(papersRef, orderBy("subject"), orderBy("year", "desc"));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Paper, "id">),
        }));

        setPapers(data);
        setFilteredPapers(data);
      } catch (error: any) {
        console.error("Error fetching filtered papers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredPapers();
  }, [authority, course, field, term]);


  // 🔹 Search filter (client-side)
  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = papers.filter(paper =>
      paper.subject.toLowerCase().includes(query) ||
      paper.term.toString().toLowerCase().includes(query) ||
      paper.season.toLowerCase().includes(query) ||
      paper.year.toString().includes(query)
    );
    setFilteredPapers(filtered);
  }, [search, papers]);

  const handleEditPQA = (id: string) => router.push(`/editPQA?id=${id}`);
  const handleEdit = (paperInfo: Paper) => {
    const encoded = encodeURIComponent(JSON.stringify(paperInfo));
    router.push(`/EditPaper?paperInfo=${encoded}`);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this paper?")) return;
    try {
      await deleteDoc(doc(db, "papers", id));
      setPapers(prev => prev.filter(p => p.id !== id));
      setFilteredPapers(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete paper:", error);
    }
  };

  if (loading) return <Loading />;

  return (
    <Protected>
      <div className="p-4 md:w-[800px] mx-auto flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-center md:text-left">Manage Papers</h1>

        {/* 🔹 Dropdowns */}
        <div className="flex">
          <select className="select select-bordered w-full text-nowrap md:col-span-3" value={authority} onChange={e => setAuthority(e.target.value)}>
            <option value="">Select authority...</option>
            {authorities.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select className="select select-bordered w-full text-nowrap" value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">Select course...</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select className="select select-bordered w-full text-nowrap" value={field} onChange={e => setField(e.target.value)}>
            <option value="">Select Field...</option>
            <option value="common">Common</option>
            {fields.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select className="select select-bordered w-full text-nowrap" value={term} onChange={e => setTerm(e.target.value)}>
            <option value="">Select term...</option>
            {terms.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* 🔹 Search Bar */}
        <div className="form-control w-full py-1">
          <input
            type="text"
            placeholder="Search by subject, term, season, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        {/* 🔹 Papers Display */}
        {filteredPapers.length === 0 ? (
          <div className="text-center text-gray-500 p-4">No papers found.</div>
        ) : (
          filteredPapers.map((paper) => (
            <div key={paper.id} className="bg-base-100 shadow-md rounded p-2 flex flex-row justify-between items-center gap-1">
              <div>
                <h2 className="font-semibold text-md">{paper.subject}</h2>
                <div className="flex gap-1 text-gray-500 text-sm">
                  <span>Sem: {paper.term}</span>
                  <span>{paper.season}</span>
                  <span>{paper.year}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleDelete(paper.id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
                <button onClick={() => handleEdit(paper)} className="bg-blue-500 text-white px-2 rounded">Edit Info</button>
                <button onClick={() => handleEditPQA(paper.id)} className="bg-green-500 text-white px-2 rounded">Edit PQA</button>
              </div>
            </div>
          ))
        )}
      </div>
    </Protected>
  );
}
