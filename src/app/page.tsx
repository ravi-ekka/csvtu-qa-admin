'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Protected from './Protected';

export default function Dashboard() {
  const [stats, setStats] = useState({
    papers: 0,
    questions: 0,
    courses: 0,
    authorities: 0,
  });
  const [papersData, setPapersData] = useState<any[]>([]);
  const [yearChart, setYearChart] = useState<any[]>([]);
  const [authorityChart, setAuthorityChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#4F46E5', '#22C55E', '#EF4444', '#F59E0B', '#06B6D4'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [papersSnap, quesSnap, courseSnap, eduSnap] = await Promise.all([
          getDocs(collection(db, 'papers')),
          getDocs(collection(db, 'que-Ans')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'education')),
        ]);

        const papers = papersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const ques = quesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const courses = courseSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const education = eduSnap.docs.map((d) => d.data());

        // Count unique authorities
        const authoritiesSet = new Set(
          education.flatMap((e: any) =>
            e.name === 'authority' ? JSON.parse(e.authorities).map((a: any) => a.id) : []
          )
        );

        setStats({
          papers: papers.length,
          questions: ques.length,
          courses: courses.length,
          authorities: authoritiesSet.size,
        });

        // Chart: Papers by Year
        const yearCount: Record<string, number> = {};
        papers.forEach((p: any) => {
          const y = p.year || 'Unknown';
          yearCount[y] = (yearCount[y] || 0) + 1;
        });
        setYearChart(
          Object.entries(yearCount).map(([year, count]) => ({ year, count }))
        );

        // Chart: Papers by Authority
        const authCount: Record<string, number> = {};
        papers.forEach((p: any) => {
          const a = p.authority || 'Unknown';
          authCount[a] = (authCount[a] || 0) + 1;
        });
        setAuthorityChart(
          Object.entries(authCount).map(([name, value]) => ({ name, value }))
        );

        setPapersData(papers.slice(0, 10)); // recent 10 papers
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  return (
    <Protected>
      <div className="p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">📊 Admin Dashboard</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Total Papers', value: stats.papers, color: 'bg-blue-100 text-blue-600' },
            { title: 'Total Questions', value: stats.questions, color: 'bg-green-100 text-green-600' },
            { title: 'Courses', value: stats.courses, color: 'bg-purple-100 text-purple-600' },
            { title: 'Authorities', value: stats.authorities, color: 'bg-yellow-100 text-yellow-600' },
          ].map((s, i) => (
            <div key={i} className={`card ${s.color} shadow p-4 text-center`}>
              <p className="text-sm font-medium">{s.title}</p>
              <h2 className="text-3xl font-bold">{s.value}</h2>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Papers by Year */}
          <div className="card bg-base-100 shadow p-4">
            <h2 className="font-semibold mb-2">📅 Papers by Year</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Papers by Authority */}
          <div className="card bg-base-100 shadow p-4">
            <h2 className="font-semibold mb-2">🏛️ Papers by Authority</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={authorityChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {authorityChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Papers */}
        <div className="card bg-base-100 shadow p-4">
          <h2 className="font-semibold mb-2">📝 Recent Papers</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th>Subject</th>
                  <th>Year</th>
                  <th>Season</th>
                  <th>Authority</th>
                  <th>Course</th>
                  <th>Field</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {papersData.map((p) => (
                  <tr key={p.id} className="hover">
                    <td>{p.subject}</td>
                    <td>{p.year}</td>
                    <td>{p.season}</td>
                    <td>{p.authority}</td>
                    <td>{p.course}</td>
                    <td>{p.field}</td>
                    <td>{p.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Protected>
  );
}
