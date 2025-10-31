import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt, paperInfo, marks } = await req.json();
    console.log("🔹 Incoming prompt:", prompt, paperInfo, marks);

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    const systemPrompt = `
You are a helpful and knowledgeable teacher assistant.
Your task: generate clear, well-structured HTML answers for educational questions.
Context:
- Subject: ${paperInfo.subject || "General"}
- Course/School/College: ${paperInfo.course || "None"}
- Branch/Stream/field: ${paperInfo.field || "None"}
- Marks per question: ${marks || "None"}
- Semester/Class/: ${paperInfo.term || "None"}
- Include references: No
- Format: HTML only (no markdown)
- Answer Style: Crisp, accurate, and student-friendly.
- Difficulty: Easy
Your HTML output must include:
1. Proper HTML tags (<h2>, <p>, <ul>, etc.)
2. No <html>, <head>, or <body> tags (only inner HTML for embedding in a page)
3. Avoid inline CSS or JS — keep it clean and semantic.
4. Don’t use markdown.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    console.log("🔹 OpenAI response:", completion);

    const message = completion.choices?.[0]?.message?.content || null;

    return NextResponse.json({ output: message });
  } catch (error: any) {
    console.error("❌ API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
