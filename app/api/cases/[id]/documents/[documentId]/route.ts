import { NextResponse } from "next/server";
import { getCaseDocumentById, isExternalDocumentReference, readCaseDocumentBinary } from "@/lib/turicum/case-documents";

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ id: string; documentId: string }>;
  }
) {
  const { id, documentId } = await params;
  const document = await getCaseDocumentById(id, documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (isExternalDocumentReference(document.storagePath)) {
    return NextResponse.redirect(document.storagePath);
  }

  try {
    const file = await readCaseDocumentBinary(document);

    return new NextResponse(file.bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stored file is not available"
      },
      { status: 404 }
    );
  }
}
