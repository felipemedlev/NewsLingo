export type DictionaryForm = {
  form_id: string;
  hebrew_plain: string;
  hebrew_with_nekudot: string;
  meaning: string | null;
  transliteration: string | null;
  tense?: string | null;
  gender?: string | null;
  number?: string | null;
  form_type?: string | null;
};

export type DictionaryEntry = {
  pealim_id: number;
  word: string;
  word_with_nekudot: string;
  meaning: string;
  meanings: string[];
  part_of_speech: string;
  transliteration: string | null;
  root: string | null;
  forms: DictionaryForm[];
};

export type TokenMatch = {
  entry: DictionaryEntry;
  form: DictionaryForm | null;
  matchType: "headword" | "form" | "prefix" | "spelling";
  source: "hebrewtime" | "sample";
};

type IndexedCandidate = {
  id: number;
  formId: string | null;
  headword: string;
  meaning: string;
  partOfSpeech: string;
  transliteration: string | null;
};

const indexCache = new Map<string, Promise<Record<string, IndexedCandidate[]>>>();
const entryCache = new Map<number, Promise<DictionaryEntry | null>>();

export const stripNiqqud = (text: string) => text.normalize("NFKC").replace(/[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C5\u05C7\u200e\u200f]/g, "");

export function matchingForms(entry: DictionaryEntry, clicked: string): DictionaryForm[] {
  const clean = stripNiqqud(clicked.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""));
  return entry.forms.filter((form) => stripNiqqud(form.hebrew_plain) === clean);
}

/** Original demonstration entries only. Replace with an approved HebrewTime snapshot at launch. */
export const DEMO_DICTIONARY: DictionaryEntry[] = [
  { pealim_id: 100001, word: "ממשלה", word_with_nekudot: "מֶמְשָׁלָה", meaning: "government", meanings: ["government"], part_of_speech: "Noun – feminine", transliteration: "memshala", root: "מ - ש - ל", forms: [] },
  { pealim_id: 100002, word: "תוכנית", word_with_nekudot: "תּוֹכְנִית", meaning: "plan, program", meanings: ["plan", "program"], part_of_speech: "Noun – feminine", transliteration: "tokhnit", root: "ת - כ - נ", forms: [] },
  { pealim_id: 100003, word: "תחבורה", word_with_nekudot: "תַּחְבּוּרָה", meaning: "transportation", meanings: ["transportation", "transit"], part_of_speech: "Noun – feminine", transliteration: "takhbura", root: "ח - ב - ר", forms: [] },
  { pealim_id: 100004, word: "תושבים", word_with_nekudot: "תּוֹשָׁבִים", meaning: "residents", meanings: ["residents"], part_of_speech: "Noun – masculine plural", transliteration: "toshavim", root: "י - ש - ב", forms: [{ form_id: "p", hebrew_plain: "תושבים", hebrew_with_nekudot: "תּוֹשָׁבִים", meaning: "residents", transliteration: "toshavim", number: "plural", gender: "masculine", form_type: "noun" }] },
  { pealim_id: 100005, word: "אישרו", word_with_nekudot: "אִשְּׁרוּ", meaning: "approved", meanings: ["approve", "confirm"], part_of_speech: "Verb – PI'EL", transliteration: "ishru", root: "א - ש - ר", forms: [{ form_id: "PERF-3mp", hebrew_plain: "אישרו", hebrew_with_nekudot: "אִשְּׁרוּ", meaning: "they approved", transliteration: "ishru", tense: "past", gender: "masculine", number: "plural", form_type: "verb" }] },
  { pealim_id: 100006, word: "בעיר", word_with_nekudot: "בָּעִיר", meaning: "in the city", meanings: ["in the city"], part_of_speech: "Noun – feminine", transliteration: "ba'ir", root: "ע - י - ר", forms: [{ form_id: "s", hebrew_plain: "עיר", hebrew_with_nekudot: "עִיר", meaning: "city", transliteration: "ir", number: "singular", gender: "feminine", form_type: "noun" }] },
  { pealim_id: 100007, word: "חדשה", word_with_nekudot: "חֲדָשָׁה", meaning: "new", meanings: ["new"], part_of_speech: "Adjective – feminine", transliteration: "khadasha", root: "ח - ד - ש", forms: [{ form_id: "fs-a", hebrew_plain: "חדשה", hebrew_with_nekudot: "חֲדָשָׁה", meaning: "new (feminine)", transliteration: "khadasha", gender: "feminine", number: "singular", form_type: "adjective" }] },
  { pealim_id: 100008, word: "הממשלה", word_with_nekudot: "הַמֶּמְשָׁלָה", meaning: "the government", meanings: ["government"], part_of_speech: "Noun – feminine", transliteration: "hamemshala", root: "מ - ש - ל", forms: [] },
  { pealim_id: 100009, word: "השבוע", word_with_nekudot: "הַשָּׁבוּעַ", meaning: "this week, the week", meanings: ["this week", "the week"], part_of_speech: "Noun – masculine", transliteration: "hashavua", root: "ש - ב - ע", forms: [] },
  { pealim_id: 100010, word: "תחליף", word_with_nekudot: "תַּחֲלִיף", meaning: "replace", meanings: ["replace"], part_of_speech: "Verb – HIF'IL", transliteration: "takhlif", root: "ח - ל - פ", forms: [{ form_id: "IMPF-3ms", hebrew_plain: "יחליף", hebrew_with_nekudot: "יַחֲלִיף", meaning: "he will replace", transliteration: "yakhlif", tense: "future", gender: "masculine", number: "singular", form_type: "verb" }] },
];

function prefixCandidates(word: string) {
  const prefixes = new Set(["ה", "ו", "ב", "כ", "ל", "מ", "ש"]);
  const candidates = [word];
  let current = word;
  for (let i = 0; i < 3; i++) {
    if (current.startsWith("מה") && current.length > 3) current = current.slice(2);
    else if (prefixes.has(current[0]!) && current.length > 2) current = current.slice(1);
    else break;
    candidates.push(current);
  }
  return candidates;
}

export function findDictionaryMatches(surface: string, dictionary: DictionaryEntry[] = DEMO_DICTIONARY): TokenMatch[] {
  const plain = stripNiqqud(surface.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""));
  if (!plain) return [];
  const headwords = dictionary.filter((entry) => stripNiqqud(entry.word) === plain);
  if (headwords.length) return headwords.map((entry) => ({ entry, form: null, matchType: "headword", source: "sample" }));
  const forms = dictionary.flatMap((entry) => entry.forms
    .filter((form) => stripNiqqud(form.hebrew_plain) === plain)
    .map((form) => ({ entry, form, matchType: "form" as const, source: "sample" as const })));
  if (forms.length) return forms;
  for (const base of prefixCandidates(plain).slice(1)) {
    const matches = findDictionaryMatches(base, dictionary).filter((match) => match.matchType !== "prefix");
    if (matches.length) return matches.map((match) => ({ ...match, matchType: "prefix" }));
  }
  return [];
}

async function loadIndex(letter: string): Promise<Record<string, IndexedCandidate[]>> {
  let request = indexCache.get(letter);
  if (!request) {
    request = fetch(`/data/dictionary/v1/index/${letter.codePointAt(0)!.toString(16)}.json`)
      .then((response) => response.ok ? response.json() as Promise<Record<string, IndexedCandidate[]>> : {})
      .catch(() => ({}));
    indexCache.set(letter, request);
  }
  return request;
}

async function loadEntry(id: number): Promise<DictionaryEntry | null> {
  let request = entryCache.get(id);
  if (!request) {
    const shard = Math.floor(id / 100);
    request = fetch(`/data/dictionary/v1/entries/${shard}.json`)
      .then(async (response) => {
        if (!response.ok) return null;
        const entries = await response.json() as Record<string, DictionaryEntry>;
        return entries[String(id)] ?? null;
      })
      .catch(() => null);
    entryCache.set(id, request);
  }
  return request;
}

/** Read only the one on-demand index and entry shard needed for a selected word. */
export async function findPublishedDictionaryMatches(surface: string): Promise<TokenMatch[]> {
  const plain = stripNiqqud(surface.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""));
  if (!plain) return [];
  const exactIndex = await loadIndex([...plain][0]!);
  let candidates = exactIndex[plain] ?? [];
  let matchType: TokenMatch["matchType"] = candidates.some((candidate) => candidate.formId === null) ? "headword" : "form";
  if (!candidates.length) {
    for (const base of prefixCandidates(plain).slice(1)) {
      const prefixIndex = await loadIndex([...base][0]!);
      candidates = (prefixIndex[base] ?? []);
      if (candidates.length) { matchType = "prefix"; break; }
    }
    if (!candidates.length) {
      // Pealim often stores defective spelling (טילו, מתכון, דווחים).
      // Try only these bounded orthographic variants, never arbitrary edit distance.
      for (const base of prefixCandidates(plain)) {
        const variants = [...new Set([base.replace(/יי/g, "י").replace(/וו/g, "ו"), base.replace(/יו/g, "ו")])].filter(value => value !== base);
        for (const variant of variants) {
          const index = await loadIndex([...variant][0]!);
          candidates = index[variant] ?? [];
          if (candidates.length) break;
        }
        if (candidates.length) { matchType = "spelling"; break; }
      }
    }
    if (!candidates.length) return [];
  }
  return Promise.all(candidates.slice(0, 5).map(async (candidate) => {
    const entry = await loadEntry(candidate.id);
    if (!entry) return null;
    const form = candidate.formId ? entry.forms.find((item) => item.form_id === candidate.formId) ?? null : null;
    return { entry, form, matchType: (matchType === "prefix" || matchType === "spelling") ? matchType : form ? "form" : "headword", source: "hebrewtime" } satisfies TokenMatch;
  })).then((matches) => matches.filter((item): item is NonNullable<typeof item> => item !== null));
}
