'use client';

import React, { useContext, useEffect, useMemo, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend as ReLegend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts";
import Loading from "./components/loading";
import Protected from "./Protected";


/**
 * Dashboard: data-driven admin dashboard
 * - mobile-first responsive layout
 * - charts use ResponsiveContainer so they resize
 * - minimal defensive checks for missing fields
 */

type PaperDoc = {
  id: string;
  subject?: string;
  season?: string;
  year?: number;
  branch?: string;
  semester?: string | number;
  createdAt?: any;
  [k: string]: any;
};

type QADoc = {
  id: string;
  question?: string;
  answare?: string;
  paperId?: string;
  createdAt?: any;
  [k: string]: any;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8A2BE2", "#FF4D4F"];

export default function DashboardPage() {
  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [qas, setQas] = useState<QADoc[]>([]);
  const [subjectsCount, setSubjectsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // simple filter state (ready to use in charts / lists)
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        // Papers
        const papersSnap = await getDocs(collection(db, "papers"));
        const papersData: PaperDoc[] = papersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        // Q&A
        const qasSnap = await getDocs(collection(db, "que-Ans"));
        const qasData: QADoc[] = qasSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        // subjects count (quick)
        const subjectsSnap = await getDocs(collection(db, "subjects"));

        if (!mounted) return;
        setPapers(papersData);
        setQas(qasData);
        setSubjectsCount(subjectsSnap.size);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (mounted) setError("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // Derived stats
  const papersCount = papers.length;
  const qaCount = qas.length;

  // Group by season
  const papersBySeason = useMemo(() => {
    const map: Record<string, number> = {};
    papers.forEach(p => {
      const s = (p.season || "Unknown").toString();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([season, count]) => ({ season, count }));
  }, [papers]);

  // Group by year (sorted)
  const papersByYear = useMemo(() => {
    const map: Record<string, number> = {};
    papers.forEach(p => {
      const y = p.year ? String(p.year) : "Unknown";
      map[y] = (map[y] || 0) + 1;
    });
    const arr = Object.entries(map).map(([year, count]) => ({ year, count }));
    arr.sort((a, b) => (a.year === "Unknown" ? 1 : b.year === "Unknown" ? -1 : Number(a.year) - Number(b.year)));
    return arr;
  }, [papers]);

  // Group by branch
  const papersByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    papers.forEach(p => {
      const b = (p.branch || "Other").toString();
      map[b] = (map[b] || 0) + 1;
    });
    return Object.entries(map).map(([branch, count]) => ({ branch, count }));
  }, [papers]);

  // Recent items
  const recentPapers = useMemo(() => {
    // sort by createdAt if present, otherwise fallback to original order
    const sorted = [...papers].sort((a, b) => {
      const at = (a.createdAt && a.createdAt.toDate) ? a.createdAt.toDate().getTime() : 0;
      const bt = (b.createdAt && b.createdAt.toDate) ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    });
    return sorted.slice(0, 6);
  }, [papers]);

  const recentQAs = useMemo(() => {
    const sorted = [...qas].sort((a, b) => {
      const at = (a.createdAt && a.createdAt.toDate) ? a.createdAt.toDate().getTime() : 0;
      const bt = (b.createdAt && b.createdAt.toDate) ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    });
    return sorted.slice(0, 6);
  }, [qas]);

  // filtered papers for charts or lists (based on selected filters)
  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      if (selectedYear !== "all" && String(p.year) !== selectedYear) return false;
      if (selectedSeason !== "all" && String(p.season) !== selectedSeason) return false;
      return true;
    });
  }, [papers, selectedYear, selectedSeason]);

  if (loading) return <Loading />
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }
  return (
    <Protected>
      <div className="p-4 md:p-6 lg:p-8 bg-gray-100 w-full">
        <div className="w-full mx-auto">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Overview of papers, Q&A and subjects</p>
            </div>

            {/* small filter controls */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input input-bordered text-sm"
              >
                <option value="all">All years</option>
                {papersByYear.map(y => y.year !== "Unknown" ? <option key={y.year} value={y.year}>{y.year}</option> : null)}
              </select>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="input input-bordered text-sm"
              >
                <option value="all">All seasons</option>
                {papersBySeason.map(s => <option key={s.season} value={s.season}>{s.season}</option>)}
              </select>
            </div>
          </header>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <span className="text-sm text-gray-500">Total Papers</span>
              <span className="text-2xl font-semibold">{papersCount}</span>
              <span className="text-xs text-gray-400 mt-2">Papers matching filter: {filteredPapers.length}</span>
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <span className="text-sm text-gray-500">Total Q&A</span>
              <span className="text-2xl font-semibold">{qaCount}</span>
              <span className="text-xs text-gray-400 mt-2">Recent Q&A: {recentQAs.length}</span>
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <span className="text-sm text-gray-500">Subjects</span>
              <span className="text-2xl font-semibold">{subjectsCount ?? "-"}</span>
              <span className="text-xs text-gray-400 mt-2">Use Manage Subject to edit</span>
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <span className="text-sm text-gray-500">Branches</span>
              <span className="text-2xl font-semibold">{papersByBranch.length}</span>
              <span className="text-xs text-gray-400 mt-2">Distinct branches</span>
            </div>
          </div>

          {/* Charts + lists - responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column: Seasons pie + Years line */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Papers by Season</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={papersBySeason} dataKey="count" nameKey="season" cx="50%" cy="50%" outerRadius={60} label>
                        {papersBySeason.map((entry, idx) => <Cell key={entry.season} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <ReTooltip />
                      <ReLegend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Papers by Year (trend)</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={papersByYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <ReTooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Middle column: Branch bar chart */}
            <div className="col-span-1 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Papers by Branch</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={papersByBranch} margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ReTooltip />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right column: recent lists */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Recent Papers</h3>
                <div className="space-y-3">
                  {recentPapers.length === 0 ? (
                    <div className="text-sm text-gray-500">No papers yet</div>
                  ) : (
                    recentPapers.map(p => (
                      <div key={p.id} className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{p.subject || "Untitled"}</div>
                          <div className="text-xs text-gray-500">
                            {p.branch ? `${p.branch} • ` : ""}{p.semester ? `Sem ${p.semester} • ` : ""}{p.year || "-"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">{p.createdAt && p.createdAt.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString() : ""}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Recent Q&A</h3>
                <div className="space-y-3">
                  {recentQAs.length === 0 ? (
                    <div className="text-sm text-gray-500">No Q&A yet</div>
                  ) : (
                    recentQAs.map(q => (
                      <div key={q.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm line-clamp-2">{q.question || q.ques || "—"}</div>
                          <div className="text-xs text-gray-500">{q.paperId ? `Paper: ${q.paperId}` : ""}</div>
                        </div>
                        <div className="text-xs text-gray-400">{q.createdAt && q.createdAt.toDate ? new Date(q.createdAt.toDate()).toLocaleDateString() : ""}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
