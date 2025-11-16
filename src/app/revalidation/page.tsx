'use client';
import { useState } from "react";

export default function Revalidate() {
  const [path, setPath] = useState("/");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRevalidate = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/revalidate-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ Revalidated ${data.path} at ${new Date(data.now).toLocaleTimeString()}`);
      } else {
        setStatus(`❌ Failed: ${data.message || data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Manage Subjects — Revalidate Site
        </h1>

        <input
          type="text"
          placeholder="Enter path (e.g. /path)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRevalidate()}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={handleRevalidate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Revalidating..." : "Trigger Revalidation"}
        </button>

        {status && (
          <div
            className={`mt-3 text-center font-medium ${
              status.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}


// Invoke-WebRequest -Uri "https://csvtu-questions-answer.vercel.app/api/revalidate/" `
//   -Method POST `
//   -Headers @{ "Content-Type" = "application/json"; "x-secret" = "mystrongsecret123" } `
//   -Body '{"path":"/btech"}'
