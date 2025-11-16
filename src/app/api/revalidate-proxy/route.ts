import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { path } = await req.json();

    if (typeof path !== "string" || !path.startsWith("/")) {
      return NextResponse.json({ message: "Invalid path format" }, { status: 400 });
    }

    // const res = await fetch("http://localhost:3000/api/revalidate", {
    const res = await fetch("https://questionans.vercel.app/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Admin revalidate proxy error:", err);
    return NextResponse.json({ message: "Internal server error", error: String(err) }, { status: 500 });
  }
}
