import "server-only";

const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);
const GOOGLE_DRIVE_REF_PREFIX = "gdrive://";

export type GoogleDriveReferenceKind = "file" | "folder";

export interface GoogleDriveReference {
  kind: GoogleDriveReferenceKind;
  id: string;
}

function normalizeGoogleDriveId(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function parseGoogleDriveRef(value: string): GoogleDriveReference | null {
  if (!value.startsWith(GOOGLE_DRIVE_REF_PREFIX)) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const kind = url.hostname === "folder" ? "folder" : url.hostname === "file" ? "file" : null;
  const id = normalizeGoogleDriveId(url.pathname);

  if (!kind || !id) {
    return null;
  }

  return { kind, id };
}

function parseGoogleDriveHttpUrl(value: string): GoogleDriveReference | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!GOOGLE_DRIVE_HOSTS.has(url.hostname)) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (url.hostname === "drive.google.com") {
    if (segments[0] === "drive" && segments[1] === "folders" && segments[2]) {
      return { kind: "folder", id: normalizeGoogleDriveId(segments[2]) };
    }

    if (segments[0] === "file" && segments[1] === "d" && segments[2]) {
      return { kind: "file", id: normalizeGoogleDriveId(segments[2]) };
    }

    const queryId = normalizeGoogleDriveId(url.searchParams.get("id") ?? "");
    if (queryId) {
      return { kind: "file", id: queryId };
    }
  }

  if (url.hostname === "docs.google.com") {
    const dIndex = segments.indexOf("d");
    const docId = dIndex >= 0 ? normalizeGoogleDriveId(segments[dIndex + 1] ?? "") : "";

    if (docId) {
      return { kind: "file", id: docId };
    }
  }

  return null;
}

export function parseGoogleDriveReference(value?: string | null): GoogleDriveReference | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (!trimmed.includes("://")) {
    return null;
  }

  return parseGoogleDriveRef(trimmed) ?? parseGoogleDriveHttpUrl(trimmed);
}

export function buildGoogleDriveStoragePath(reference: GoogleDriveReference) {
  return `${GOOGLE_DRIVE_REF_PREFIX}${reference.kind}/${reference.id}`;
}

export function resolveGoogleDriveHref(value?: string | null) {
  const reference = parseGoogleDriveReference(value);

  if (reference) {
    return reference.kind === "folder"
      ? `https://drive.google.com/drive/folders/${reference.id}`
      : `https://drive.google.com/file/d/${reference.id}/view`;
  }

  return null;
}

export function buildGoogleDriveFolderHref(folderId?: string | null) {
  const trimmed = folderId?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseGoogleDriveReference(trimmed);
  if (parsed?.kind === "folder") {
    return `https://drive.google.com/drive/folders/${parsed.id}`;
  }

  return `https://drive.google.com/drive/folders/${normalizeGoogleDriveId(trimmed)}`;
}

export function buildGoogleDriveFileHref(fileId?: string | null) {
  const trimmed = fileId?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseGoogleDriveReference(trimmed);
  if (parsed?.kind === "file") {
    return `https://drive.google.com/file/d/${parsed.id}/view`;
  }

  return `https://drive.google.com/file/d/${normalizeGoogleDriveId(trimmed)}/view`;
}
