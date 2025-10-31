'use client';
import { db } from "@/firebase/firebaseConfig";
import { collection, doc, getDocs, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "../components/loading";
import Protected from "../Protected";

interface Paper {
  id: string;
  subject: string;
  semester: string;
  season: string;
  year: string | number;
}

export default function ManagePaper() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "papers"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Paper, "id">) }));
        setPapers(data);
        setFilteredPapers(data); // Initially, all papers
      } catch (error) {
        console.error("Error fetching papers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, []);

  // Filter papers based on search input
  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = papers.filter(paper =>
      paper.subject.toLowerCase().includes(query) ||
      paper.semester.toString().toLowerCase().includes(query) ||
      paper.season.toLowerCase().includes(query) ||
      paper.year.toString().includes(query)
    );
    setFilteredPapers(filtered);
  }, [search, papers]);

  const handleEditPQA = (id: string) => {
    router.push(`/editPQA?id=${id}`);
  };

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
  return (<Protected>
    <div className="p-4 md:w-[800px] mx-auto flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-center md:text-left">Manage Papers</h1>

      {/* Search Bar */}
      <div className="form-control w-full py-1">
        <input
          type="text"
          placeholder="Search by subject, semester, season, or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {filteredPapers.length === 0 ? (
        <div className="text-center text-gray-500 p-4">No papers found.</div>
      ) : (
        filteredPapers.map((paper) => (
          <div
            key={paper.id}
            className="bg-base-100 shadow-md rounded p-2 flex flex-row justify-between md:flex-row md:justify-between md:items-center gap-1"
          >
            <div className="flex flex-col md:flex-row md:items-center md:gap-2">
              <h2 className="font-semibold text-md">{paper.subject}</h2>
              <div className="flex gap-1 text-gray-500 text-sm">
                <span>Sem:{paper.semester}</span>
                <span>{paper.season}</span>
                <span>{paper.year}</span>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap mt-2 md:mt-0 items-end justify-end md:justify-end">
              <button onClick={() => handleDelete(paper.id)} className="bg-red-500 px-1 ">
                Delete
              </button>
              <button onClick={() => handleEdit(paper)} className="bg-blue-500 px-1 ">
                Edit Info
              </button>
              <button onClick={() => handleEditPQA(paper.id)} className="bg-blue-500 px-1 ">
                Edit PQA
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </Protected>);
}
