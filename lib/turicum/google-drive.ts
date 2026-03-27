import "server-only";

export function buildGoogleDriveFolderHref(folderId?: string | null) {
  const trimmed = folderId?.trim();
  if (!trimmed) {
    return null;
  }
  return `https://drive.google.com/drive/folders/${trimmed}`;
}

export function buildGoogleDriveFileHref(fileId?: string | null) {
  const trimmed = fileId?.trim();
  if (!trimmed) {
    return null;
  }
  return `https://drive.google.com/file/d/${trimmed}/view`;
}
