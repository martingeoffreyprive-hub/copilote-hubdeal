import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clientKey = req.headers.get("x-openai-key");
  const apiKey = clientKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;
    if (!audioFile) {
      return NextResponse.json({ error: "Fichier audio manquant" }, { status: 400 });
    }

    const body = new FormData();
    body.append("file", audioFile, "audio.webm");
    body.append("model", "whisper-1");
    body.append("language", (formData.get("language") as string) || "fr");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Erreur transcription" }, { status: 500 });
  }
}
