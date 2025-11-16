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
Your task: Generate clear, well-structured HTML answers for educational questions.

Your answers MUST:
- Be 100% unique and written in your own words (NO copying, NO plagiarism).
- Be copyright-free and safe for publication on public websites.
- Be optimized for SEO and Google search (use relevant keywords naturally, include helpful structure: <h2>, <h3>, <ul>, <ol>, <p>).
- Be informative, easy to read, and highly valuable for students.
- Ensure content is original, concise, and factually accurate.
- Avoid listing or copying answers from the original source or other websites.
- No references, citations, or external copyright material.
- Use simple, student-friendly language and answer style.
- Use only clean, semantic HTML tags for structure (no HTML, head, or body tags; no inline CSS/JS; no markdown).
- Include a brief, relevant heading (<h2>) for each answer.
- For code, commands, or structured text (anything that should preserve spaces, tabs, or alignment) wrap it inside <pre> tag

Context:
- Subject: ${paperInfo.subject || "General"}
- Course/School/College: ${paperInfo.course || "None"}
- Branch/Stream/field: ${paperInfo.field || "None"}
- Marks per question: ${marks || "None"}
- Semester/Class: ${paperInfo.term || "None"}

Format: **HTML only**
Difficulty: Easy

Do not include any disclaimer or author's note.

Remember: Every answer must be original, SEO-optimized, student-focused, and ready for embedding in a webpage.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
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
