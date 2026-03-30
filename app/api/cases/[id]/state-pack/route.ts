import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCaseById } from "@/lib/turicum/cases";
import {
  isExternalDocumentReference,
  listCaseDocuments,
  readCaseDocumentBinary,
  resolveExternalDocumentHref
} from "@/lib/turicum/case-documents";
import { getBorrowerPortalByCaseId } from "@/lib/turicum/intake";
import { getLatestCommercialLoanApplicationByEmail } from "@/lib/turicum/commercial-loan-applications";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";
import { getCategoryLabel, getDocumentTypeLabel } from "@/lib/turicum/state-packs";

const execFileAsync = promisify(execFile);

function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSafeFileName(value: string, fallback: string) {
  const normalized = sanitizeFileSegment(value);
  return normalized || fallback;
}

function isVerifiedStatus(status: string) {
  return status === "approved" || status === "signed" || status === "recorded" || status === "final";
}

function buildApplicationPayload(caseId: string, portal: Awaited<ReturnType<typeof getBorrowerPortalByCaseId>>, application: Awaited<ReturnType<typeof getLatestCommercialLoanApplicationByEmail>>) {
  return {
    caseId,
    borrowerPortal: portal
      ? {
          borrowerName: portal.borrowerName,
          borrowerEmail: portal.borrowerEmail,
          portalStatus: portal.portalStatus,
          submittedForms: portal.submittedForms,
          signatureRequests: portal.signatureRequests.map((request) => ({
            title: request.title,
            status: request.status,
            recipientEmail: request.recipientEmail,
            signedAt: request.signedAt ?? null
          }))
        }
      : null,
    commercialLoanApplication: application
      ? {
          primaryBorrowerName: application.primaryBorrowerName,
          primaryBorrowerEmail: application.primaryBorrowerEmail,
          primaryBorrowerPhone: application.primaryBorrowerPhone,
          coBorrowerName: application.coBorrowerName,
          coBorrowerEmail: application.coBorrowerEmail,
          annualIncome: application.annualIncome,
          requestedAmount: application.requestedAmount,
          propertyAddress: application.propertyAddress,
          propertyType: application.propertyType,
          borrowingEntityName: application.borrowingEntityName,
          profile: application.profile,
          financials: application.financials,
          subjectProperty: application.subjectProperty,
          declarations: application.declarations
        }
      : portal?.formResponses.commercial_loan_application ?? null
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const staffProfile = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (!staffProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseRecord = await getCaseById(id);

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const documents = await listCaseDocuments(id);
  const portal = await getBorrowerPortalByCaseId(id);
  const borrowerEmail = portal?.borrowerEmail?.trim().toLowerCase() ?? "";
  const application = borrowerEmail ? await getLatestCommercialLoanApplicationByEmail(borrowerEmail) : null;

  if (documents.length === 0) {
    return NextResponse.json({ error: "No case documents are available for export yet." }, { status: 400 });
  }

  if (!documents.every((document) => isVerifiedStatus(document.status))) {
    return NextResponse.json({ error: "All diligence documents must be verified before generating the state pack." }, { status: 400 });
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "turicum-state-pack-"));

  try {
    const packFolderName = `${buildSafeFileName(caseRecord.code, "case")}-state-pack`;
    const packFolderPath = path.join(tempRoot, packFolderName);
    const documentsFolderPath = path.join(packFolderPath, "documents");

    await mkdir(documentsFolderPath, { recursive: true });

    const applicationPayload = buildApplicationPayload(id, portal, application);
    await writeFile(
      path.join(packFolderPath, "application-summary.json"),
      JSON.stringify(applicationPayload, null, 2) + "\n",
      "utf8"
    );

    await writeFile(
      path.join(packFolderPath, "README.txt"),
      [
        `Turicum State Pack`,
        `Case: ${caseRecord.code} - ${caseRecord.title}`,
        `Generated for staff counsel by ${staffProfile.email ?? "Turicum staff"}`,
        "",
        "This export contains the borrower application summary plus each verified diligence document.",
        "External references are represented as text files with their source link."
      ].join("\n"),
      "utf8"
    );

    for (const [index, document] of documents.entries()) {
      const prefix = String(index + 1).padStart(2, "0");
      const typeLabel = buildSafeFileName(getDocumentTypeLabel(document.documentTypeCode), "document");
      const titleLabel = buildSafeFileName(document.title || document.fileName, "file");
      const baseName = `${prefix}-${typeLabel}-${titleLabel}`;

      if (isExternalDocumentReference(document.storagePath)) {
        const href = resolveExternalDocumentHref(document.storagePath) ?? document.storagePath;
        await writeFile(
          path.join(documentsFolderPath, `${baseName}.url.txt`),
          [
            `Title: ${document.title}`,
            `Category: ${getCategoryLabel(document.category)}`,
            `Status: ${document.status}`,
            `Source: ${href}`
          ].join("\n"),
          "utf8"
        );
        continue;
      }

      const binary = await readCaseDocumentBinary(document);
      const extension = path.extname(binary.fileName || document.fileName || "") || "";
      await writeFile(
        path.join(documentsFolderPath, `${baseName}${extension}`),
        binary.bytes
      );
    }

    const zipName = `${packFolderName}-${randomUUID().slice(0, 8)}.zip`;
    const zipPath = path.join(tempRoot, zipName);

    await execFileAsync("zip", ["-r", "-q", zipPath, packFolderName], {
      cwd: tempRoot
    });

    const bytes = await readFile(zipPath);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${zipName}\"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate the state pack."
      },
      { status: 500 }
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
