import { readFileSync } from "node:fs";
import { mkdir, writeFile, rm, rename } from "node:fs/promises";
import path from "node:path";

const outputPath = "./public/data/dictionary/v1";
const temporaryPath = `${outputPath}.tmp`;
const pageSize = 500;

// Read only the ignored local environment file. Never print or commit credential values.
const requireFile = (() => {
  try { return readFileSync(".env.local", "utf8"); } catch { return ""; }
})();
for (const line of requireFile.split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!match || process.env[match[1]]) continue;
  const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
  process.env[match[1]] = value;
}

if (process.env.DICTIONARY_REUSE_APPROVED !== "true") {
  throw new Error("Dictionary export stopped. Verify Pealim/HebrewTime reuse terms and set DICTIONARY_REUSE_APPROVED=true only after approval.");
}

const url = process.env.HEBREWTIME_SUPABASE_URL;
const serviceRoleKey = process.env.HEBREWTIME_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Set HEBREWTIME_SUPABASE_URL and HEBREWTIME_SUPABASE_SERVICE_ROLE_KEY in your shell or ignored .env.local file.");

const endpoint = `${url.replace(/\/$/, "")}/rest/v1/dictionary_entries?select=pealim_id,word,word_with_nekudot,meaning,meanings,part_of_speech,transliteration,root,forms&order=pealim_id.asc&limit=${pageSize}`;
const rows = [];
for (let start = 0; ; start += pageSize) {
  const response = await fetch(`${endpoint}&offset=${start}`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  if (!response.ok) throw new Error(`Dictionary read failed on page ${Math.floor(start / pageSize) + 1} (HTTP ${response.status}).`);
  const data = await response.json();
  rows.push(...data);
  if (!data.length || data.length < pageSize) break;
}

const ids = new Set();
for (const entry of rows) {
  if (!Number.isSafeInteger(entry.pealim_id) || !entry.word || ids.has(entry.pealim_id)) throw new Error("Dictionary snapshot failed identity validation.");
  ids.add(entry.pealim_id);
  if (!Array.isArray(entry.forms)) entry.forms = [];
}

const indices = new Map();
const entryShards = new Map();
for (const entry of rows) {
  const shardId = Math.floor(entry.pealim_id / 100);
  if (!entryShards.has(shardId)) entryShards.set(shardId, {});
  entryShards.get(shardId)[entry.pealim_id] = entry;
  const add = (surface, formId = null) => {
    const clean = surface.normalize("NFKC").replace(/[\u0591-\u05C7]/g, "").trim();
    if (!clean || !/\p{Script=Hebrew}/u.test(clean)) return;
    const first = [...clean][0];
    if (!indices.has(first)) indices.set(first, {});
    const bucket = indices.get(first);
    bucket[clean] ??= [];
    if (!bucket[clean].some((candidate) => candidate.id === entry.pealim_id && candidate.formId === formId)) {
      bucket[clean].push({ id: entry.pealim_id, formId, headword: entry.word, meaning: entry.meaning, partOfSpeech: entry.part_of_speech, transliteration: entry.transliteration });
    }
  };
  add(entry.word);
  for (const form of entry.forms) {
    if (form.hebrew_plain && form.form_id) add(form.hebrew_plain, form.form_id);
    for (const alternative of form.aux_forms ?? []) if (alternative.hebrew_plain && form.form_id) add(alternative.hebrew_plain, form.form_id);
  }
}

await rm(temporaryPath, { recursive: true, force: true });
await mkdir(path.join(temporaryPath, "index"), { recursive: true });
await mkdir(path.join(temporaryPath, "entries"), { recursive: true });
await writeFile(path.join(temporaryPath, "manifest.json"), JSON.stringify({ schemaVersion: 1, source: "HebrewTime / Pealim", exportedAt: new Date().toISOString(), count: rows.length, indexCount: indices.size, chunkSize: 100 }));
for (const [letter, index] of indices) await writeFile(path.join(temporaryPath, "index", `${letter.codePointAt(0).toString(16)}.json`), JSON.stringify(index));
for (const [shard, entries] of entryShards) await writeFile(path.join(temporaryPath, "entries", `${shard}.json`), JSON.stringify(entries));
await rm(outputPath, { recursive: true, force: true });
await mkdir(path.dirname(outputPath), { recursive: true });
await rename(temporaryPath, outputPath);
const formCount = rows.reduce((sum, entry) => sum + entry.forms.length, 0);
console.log(`Imported ${rows.length} entries, ${formCount} forms, and ${indices.size} on-demand Hebrew indexes. The dataset will be publicly served after deployment.`);
