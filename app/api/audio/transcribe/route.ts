import { NextRequest, NextResponse } from "next/server";
import { getDefaultStt } from "@/lib/server/models";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const language = formData.get("language");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        {
          error: "Audio file is required."
        },
        { status: 400 }
      );
    }

    if (file.size < 4096) {
      return NextResponse.json({
        transcript: ""
      });
    }

    const transcript = await getDefaultStt().transcribe(file, {
      language: typeof language === "string" ? language : "English"
    });

    return NextResponse.json({
      transcript
    });
  } catch (error) {
    console.error("Audio transcription failed.", error);

    return NextResponse.json(
      {
        error: "Unable to transcribe microphone audio."
      },
      { status: 502 }
    );
  }
}
