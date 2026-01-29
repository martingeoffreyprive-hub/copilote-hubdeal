import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clientKey = req.headers.get("x-openai-key");
  const apiKey = clientKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API OpenAI manquante. Ajoutez-la dans les paramètres du copilote." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failed to proxy request to OpenAI" }, { status: 500 });
  }
}
