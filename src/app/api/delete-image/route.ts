import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
    }

    // 🔐 Use your Cloudinary credentials (safe on server)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    // 🔗 Cloudinary delete URL
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;

    // 🚀 Call Cloudinary API
    const res = await fetch(`${url}?public_ids[]=${public_id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      },
    });

    const data = await res.json();
    console.log("delete image....rout...", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
