import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCaseDocumentById,
  isExternalDocumentReference,
  readCaseDocumentBinary,
  resolveExternalDocumentHref
} from "@/lib/turicum/case-documents";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";
import { TEAM_SESSION_COOKIE, verifyTeamSessionToken } from "@/lib/turicum/team-auth";

async function requireTeamDocumentAccess() {
  const cookieStore = await cookies();
  const staffProfile = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (staffProfile) {
    return true;
  }

  const legacyToken = cookieStore.get(TEAM_SESSION_COOKIE)?.value;
  return Boolean(await verifyTeamSessionToken(legacyToken));
}

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ id: string; documentId: string }>;
  }
) {
  const hasAccess = await requireTeamDocumentAccess();

  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, documentId } = await params;
  const document = await getCaseDocumentById(id, documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (isExternalDocumentReference(document.storagePath)) {
    const href = resolveExternalDocumentHref(document.storagePath);

    if (!href) {
      return NextResponse.json({ error: "External document host is not allowed" }, { status: 400 });
    }

    return NextResponse.redirect(href);
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
