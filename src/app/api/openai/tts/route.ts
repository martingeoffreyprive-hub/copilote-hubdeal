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
        response_format: "opus",
        speed: body.speed || 1.05,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(err, { status: response.status });
    }

    // Stream the response directly for faster playback start
    const headers = new Headers({
      "Content-Type": "audio/ogg",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    });

    return new NextResponse(response.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Erreur TTS" }, { status: 500 });
  }
}
