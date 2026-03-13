import { createSupabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/hooks/get-user";
import { NextRequest, NextResponse } from "next/server";
import { getRagieClientOrThrow } from "@/lib/ragie/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ragie = getRagieClientOrThrow();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const ragieResult = await ragie.documents.create({ file });

    const documentId = ragieResult.id;

    const supabase = await createSupabaseServer();
    const { error: dbError } = await supabase.from("documents").insert({
      user_id: user.id,
      file_name: file.name,
      document_id: documentId,
      status: 'pending'
    });

    if (dbError) {
      console.error("Supabase DB Error:", dbError);
      return NextResponse.json(
        { error: "Failed to save document metadata." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, documentId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Upload API] Error:", error);
    if (msg.includes('RAGIE_API_KEY')) {
      return NextResponse.json({ error: "Ragie is not configured. Set RAGIE_API_KEY in .env.local." }, { status: 503 });
    }
    return NextResponse.json(
      { error: msg || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

