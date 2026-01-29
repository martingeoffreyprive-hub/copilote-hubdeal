import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clientKey = req.headers.get("x-openai-key");
  const apiKey = clientKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: body.input,
        voice: body.voice || "alloy",
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(err, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur TTS" }, { status: 500 });
  }
}
