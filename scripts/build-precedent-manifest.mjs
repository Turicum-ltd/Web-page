import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "data", "precedents.json");
const configPath = process.env.TURICUM_LEGAL_CORPUS_CONFIG || path.join(root, "config", "turicum-legal-corpus-sources.json");

const legacyCandidateRoots = [
  "/Users/marcohilty/Library/CloudStorage/GoogleDrive-marco.hilty@gmail.com/My Drive/Turicum/Closing Process/06 Extracted Text",
  "/Users/marcohilty/Library/CloudStorage/GoogleDrive-marco.hilty@gmail.com/.shortcut-targets-by-id/1q4vYTQYi3KJOpexu3G0spEHr9plNdeen/03 01 2026 - Hard Money Company Relaunch/Closing Process/06 Extracted Text"
];

function readConfiguredRoots() {
  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.corpusRoots)
      ? parsed.corpusRoots.filter((value) => typeof value === "string" && value.trim())
      : [];
  } catch {
    return [];
  }
}

function unique(values) {
  return [...new Set(values)];
}

function resolveCandidateRoots() {
  const configuredRoots = readConfiguredRoots();
  return unique([...configuredRoots, ...legacyCandidateRoots]);
}

function resolveExtractedRoot() {
  const candidateRoots = resolveCandidateRoots();

  for (const candidate of candidateRoots) {
    try {
      if (statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `Could not locate extracted text corpus. Checked:
${candidateRoots.join("\n")}

Config source: ${configPath}`
  );
}

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (stats.isFile() && entry.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessDocumentType(name) {
  const lower = name.toLowerCase();
  const patterns = [
    ["closing_statement", ["closing-statement"]],
    ["closing_package", ["closing-package", "closing-docs", "executed-closing-package"]],
    ["closing_instructions", ["closing-instructions", "instructions-letter", "lender-closing-instructions"]],
    ["promissory_note", ["promisorry-note", "promissory-note", "note"]],
    ["mortgage_modification", ["modification"]],
    ["mortgage", ["mortgage"]],
    ["warranty_deed", ["warranty-deed", "deed"]],
    ["title_policy", ["title-policy", "final-title-policy"]],
    ["marked_up_title", ["marked-up-title", "title_marked-up", "marked-up-title"]],
    ["title_commitment", ["title"]],
    ["purchase_agreement", ["purchase-agreement", "pa_"]],
    ["option_agreement", ["option-agreement", "real-estate-option"]],
    ["lease_agreement", ["lease-agreement", "ground-lease"]],
    ["jv_agreement", ["jv-agreement", "joint-venture", "joint_venture"]],
    ["disposition_agreement", ["disposition"]],
    ["operating_agreement", ["operating-agree", "operating_agreement"]],
    ["articles_of_organization", ["articles-of-organization", "articles-of-org"]],
    ["insurance_certificate", ["coi", "policy", "dec-pages"]],
    ["payment_authorization", ["ach-authorization", "ach-agreement", "payment-letter"]],
    ["wiring_instructions", ["wiring-instructions", "wire", "letter-of-credit"]],
    ["acknowledgment", ["acknowledgment"]],
    ["affidavit", ["affidavit"]],
    ["contact_sheet", ["contact-sheet"]]
  ];

  for (const [documentType, needles] of patterns) {
    if (needles.some((needle) => lower.includes(needle))) {
      return documentType;
    }
  }

  return "other";
}

function guessTemplateKind(documentType, name) {
  const lower = name.toLowerCase();

  if (
    [
      "title_policy",
      "marked_up_title",
      "title_commitment",
      "insurance_certificate",
      "wiring_instructions",
      "contact_sheet"
    ].includes(documentType)
  ) {
    return "supporting_example";
  }

  if (lower.includes("draft")) {
    return "template";
  }

  return "precedent";
}

function isExecuted(name) {
  return /executed|signed|final/i.test(name);
}

function isRecorded(name) {
  return /recorded/i.test(name);
}

const extractedRoot = resolveExtractedRoot();
const files = walk(extractedRoot);

const items = files.map((filePath) => {
  const relative = path.relative(extractedRoot, filePath);
  const parts = relative.split(path.sep);
  const [state = "", structure = "", caseFolder = ""] = parts;
  const fileName = path.basename(filePath);
  const baseName = fileName.replace(/\.md$/i, "");
  const documentType = guessDocumentType(baseName);

  return {
    id: slugify(relative.replace(/\.md$/i, "")),
    title: baseName,
    state,
    structureType: structure.toLowerCase() === "loan" ? "loan" : "purchase",
    caseName: caseFolder.replaceAll("_", " "),
    sourceCaseCode: baseName.match(/case\d+/i)?.[0]?.toUpperCase() ?? null,
    fileName,
    sourcePath: filePath,
    relativePath: relative,
    documentType,
    templateKind: guessTemplateKind(documentType, baseName),
    isExecuted: isExecuted(baseName),
    isRecorded: isRecorded(baseName)
  };
});

writeFileSync(outputPath, JSON.stringify(items, null, 2) + "\n", "utf8");
console.log(`Wrote ${items.length} precedent items to ${outputPath}`);
