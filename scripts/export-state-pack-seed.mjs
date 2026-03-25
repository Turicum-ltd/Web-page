import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const statePackDir = path.join(root, "config", "state-packs");
const documentTypePath = path.join(root, "config", "document-types.json");

function quote(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  const escaped = String(value).replaceAll("'", "''");
  return `'${escaped}'`;
}

function arrayLiteral(values) {
  const items = (values ?? []).map((value) => `"${String(value).replaceAll('"', '\\"')}"`);
  return `'{${
    items.join(",")
  }}'`;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const documentTypes = readJson(documentTypePath);
const statePackFiles = readdirSync(statePackDir)
  .filter((file) => file.endsWith(".json") && file !== "state-pack.schema.json")
  .sort();

const statements = [];

for (const entry of documentTypes) {
  statements.push(
    `insert into document_types (code, label, default_category) values (${quote(entry.code)}, ${quote(entry.label)}, ${quote(entry.default_category)}) on conflict (code) do update set label = excluded.label, default_category = excluded.default_category;`
  );
}

for (const file of statePackFiles) {
  const statePack = readJson(path.join(statePackDir, file));
  const packCte = `pack_${statePack.state.toLowerCase()}`;

  statements.push(
    `with ${packCte} as (
  insert into state_packs (state_code, version, enabled, support_level, notes)
  values (${quote(statePack.state)}, ${quote(statePack.version)}, ${statePack.enabled ? "true" : "false"}, ${quote(statePack.support_level)}, ${quote(statePack.notes ?? "")})
  on conflict (state_code, version) do update
    set enabled = excluded.enabled,
        support_level = excluded.support_level,
        notes = excluded.notes
  returning id
)
select id from ${packCte};`
  );

  for (const structure of statePack.supported_structures) {
    statements.push(
      `insert into state_pack_structures (state_pack_id, structure_type)
select id, ${quote(structure)}
from state_packs
where state_code = ${quote(statePack.state)} and version = ${quote(statePack.version)}
on conflict (state_pack_id, structure_type) do nothing;`
    );
  }

  for (const document of statePack.documents) {
    statements.push(
      `insert into state_pack_documents (
  state_pack_id,
  structure_type,
  document_type_code,
  category,
  stage,
  requirement_level,
  notes
)
select
  id,
  ${quote(document.structure_type)},
  ${quote(document.document_type)},
  ${quote(document.category)},
  ${quote(document.stage)},
  ${quote(document.requirement_level)},
  ${quote(document.notes ?? "")}
from state_packs
where state_code = ${quote(statePack.state)} and version = ${quote(statePack.version)}
on conflict (state_pack_id, structure_type, document_type_code) do update
  set category = excluded.category,
      stage = excluded.stage,
      requirement_level = excluded.requirement_level,
      notes = excluded.notes;`
    );
  }

  for (const item of statePack.checklist_items) {
    statements.push(
      `insert into state_pack_checklist_items (
  state_pack_id,
  code,
  label,
  stage,
  required_for
)
select
  id,
  ${quote(item.code)},
  ${quote(item.label)},
  ${quote(item.stage)},
  ${arrayLiteral(item.required_for)}
from state_packs
where state_code = ${quote(statePack.state)} and version = ${quote(statePack.version)}
on conflict (state_pack_id, code) do update
  set label = excluded.label,
      stage = excluded.stage,
      required_for = excluded.required_for;`
    );
  }
}

process.stdout.write(`${statements.join("\n\n")}\n`);
