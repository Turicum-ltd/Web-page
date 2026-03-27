import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { getBasePath } from "@/lib/turicum/runtime";

function checkRequiredFiles(root: string) {
  const checks = [
    path.join(root, "public", "brand", "turicum-wordmark.svg"),
    path.join(root, "app", "icon.svg"),
    path.join(root, "data", "cases.json")
  ];

  return checks.map((file) => ({
    file: path.relative(root, file),
    ok: existsSync(file)
  }));
}

export async function GET() {
  const root = process.cwd();
  const fileChecks = checkRequiredFiles(root);
  const ok = fileChecks.every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      app: "turicum-platform",
      basePath: getBasePath(),
      timestamp: new Date().toISOString(),
      checks: {
        files: fileChecks
      }
    },
    {
      status: ok ? 200 : 503
    }
  );
}
