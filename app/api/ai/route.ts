import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { prompt, systemRole = "You are a helpful assistant" } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemRole },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }, // Forces structured data for the UI
  });

  return NextResponse.json(JSON.parse(response.choices[0].message.content!));
}