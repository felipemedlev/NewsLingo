# NewsLingo

NewsLingo is a Hebrew news reader for learners, with real publisher-feed stories, AI-assisted learning versions, a Pealim dictionary imported from HebrewTime, and personal vocabulary. Five clearly labeled practice stories remain in the archive.

## Run locally

Use Node.js 20.9 or newer, then run `npm install` and `npm run dev`. `npm run build` produces a static site in `out/` for Cloudflare Pages. `npm run typecheck` checks the app's TypeScript.

For Cloudflare Pages, use `npm run build` as the build command and `out` as the output directory. The output is plain static HTML, CSS, JavaScript, and lesson data; the deployed site does not need a server process.

## HebrewTime dictionary

The browser loads the published HebrewTime / Pealim snapshot on demand (9,283 entries in the current snapshot).

After permission is confirmed, copy `.env.example` to `.env.local`, fill in the source Supabase URL and service-role key locally, and set `DICTIONARY_REUSE_APPROVED=true`. Keep `.env.local` private. Then run `npm run import:dictionary`. The importer pages through the HebrewTime dictionary, checks stable entry IDs, and writes on-demand Hebrew indexes and grouped entry files into `public/data/dictionary/v1/`. Each click loads the matching index and entry group; the browser never receives the Supabase service key.

Setting `DICTIONARY_REUSE_APPROVED=true` is a statement by the operator that permission has been verified. It is not a permission check performed by the software.

## News publishing

News imports run locally before a static build; see Real news imports below. Scheduling is not configured.

## Current behaviour

- Easy A2 and Intermediate B1–B2 full-length learner versions of each story, with per-sentence and show-all English reveal.
- Dedicated article pages (`/news/<slug>/`) alongside a home edition, searchable archive, and My Words screen, all built with real routes and links.
- Selectable Hebrew text with full dictionary matches for headwords, inflected forms, and Hebrew prefixes.
- Word explorer panel, keyboard support, vocabulary save, and browser-local export/import.
- Light and dark themes, generated category covers (no publisher photos), comprehension questions, and an honest "AI-adapted" or demo label on every story.

Saved vocabulary and reader preferences stay in the current browser. Use the My Words screen to export a backup before clearing browser data or changing devices.

## Real news imports

Run `npm run import:news`, then `npm run build` to refresh the static website.
The importer reads Walla's public main news RSS feed (`rss.walla.co.il`), keeps
only `news.walla.co.il` items in feed order, and fetches each linked article page.
It scrapes the full body from the article HTML (not the RSS blurb). It imports the
first five stories whose full text is available. With `OPENAI_API_KEY` in
`.env.local`, it uses `gpt-5-mini` (override with `OPENAI_NEWS_MODEL`) to write two
original learner versions per story — A2 Easy (short, simple sentences) and
B1–B2 Intermediate (clearer news Hebrew) — as full rewrites that follow the whole
article in order, not short summaries. Each version includes bilingual titles and
standfirsts, vocabulary, and comprehension questions. Only the AI's own paraphrase
is stored; Walla's article text itself is not republished, and the link to the
original report is always kept. A second model pass checks attribution, source
fidelity and translation consistency, and an automated check rejects any story that
mixes English words into Hebrew text or Hebrew into English text. These remain AI
adaptations, not independently verified reporting. Without a key it imports
original headlines with an explicit translation-unavailable message. Article
covers are generated from the story's category, not publisher photos.

Optional settings: `OPENAI_NEWS_MODEL` (default `gpt-5-mini`) and
`NEWS_IMPORT_LIMIT` (1–10, default 5). Each new or changed story uses up to three
bounded API requests (draft, review, and an occasional repair pass); unchanged
stories are cached. Keys stay in the local import process and are never sent to
the browser. Feed/article-fetch/API/validation failures for one story are logged
and skipped without stopping the run; if every story in a run fails, the previous
edition is preserved. Older imported stories remain in the archive, capped at 100.
Existing Walla stories are upgraded on the next import when the generation
version changes. Imports are manual; deploying this static site does not
automatically schedule refreshes.

## Dictionary checks

`node scripts/test-dictionary.mjs` checks actual published dictionary shards,
including past/present conjugations, niqqud, prefixes and unknown words. Index
filenames use ASCII Unicode codepoints (e.g. `5d0.json`) to avoid static-server URL
decoding failures. Prefix matches retain the actual conjugation and its metadata.
