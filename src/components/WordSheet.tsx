"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown, Search, X } from "lucide-react";
import { DEMO_DICTIONARY, findDictionaryMatches, findPublishedDictionaryMatches, type TokenMatch } from "@/lib/dictionary";
import type { SavedWord } from "@/lib/useLocalPrefs";

export function WordText({ text, onWord }: { text: string; onWord: (word: string, target: HTMLElement) => void }) {
  const bits = text.split(/([\p{Script=Hebrew}\p{M}]+(?:[־׳״'’][\p{Script=Hebrew}\p{M}]+)*)/gu);
  return <>{bits.map((bit, i) => /[\p{Script=Hebrew}]/u.test(bit)
    ? <button key={`${i}-${bit}`} type="button" className="word-tap" onClick={(event) => onWord(bit, event.currentTarget)} aria-label={`Look up ${bit}`} lang="he" dir="rtl">{bit}</button>
    : <span key={`${i}-${bit}`}>{bit}</span>)}</>;
}

function MatchDetails({ match, surface, onSave, saved }: { match: TokenMatch; surface: string; onSave: () => void; saved: boolean }) {
  const { entry, form } = match;
  return <>
    <div className="lookup-answer">
      <div className="lookup-wordline"><span className="lookup-vocalized" lang="he" dir="rtl">{form?.hebrew_with_nekudot || entry.word_with_nekudot}</span></div>
      <div className="lookup-headword" lang="he" dir="rtl">{entry.word} <span>· {form ? "word form" : "dictionary entry"}</span></div>
      <div className="lookup-meaning">{form?.meaning || entry.meaning}</div>
      {entry.meanings.length > 1 && <div className="lookup-alternates"><span>OTHER MEANINGS</span>{entry.meanings.filter((meaning) => meaning !== (form?.meaning || entry.meaning)).map((meaning) => <span key={meaning}>{meaning}</span>)}</div>}
      {entry.transliteration && <div className="lookup-translit">{form?.transliteration || entry.transliteration}</div>}
      <div className="lookup-meta"><span>{entry.part_of_speech}</span>{entry.root && <span>Root {entry.root}</span>}</div>
      {match.matchType === "prefix" && <div className="match-note">Matched through a Hebrew prefix · {surface} → {entry.word}</div>}
      {match.matchType === "spelling" && <div className="match-note">Possible spelling variant · Check the meaning in context</div>}
    </div>
    {entry.forms.length > 0 && <details className="forms-details"><summary>See word forms <ChevronDown size={15} /></summary><div className="form-list">{entry.forms.map((f) => <div className="form-row" key={f.form_id}><span lang="he" dir="rtl">{f.hebrew_with_nekudot}</span><span>{f.meaning || f.form_type || "Form"}</span></div>)}</div></details>}
    <button type="button" className={`save-word-button${saved ? " is-saved" : ""}`} onClick={onSave}>{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? "Saved to My Words" : "Save this word"}</button>
    <p className="dictionary-footnote">Dictionary meaning · Context can change the translation</p>
  </>;
}

export function useWordLookup(saved: SavedWord[], updateSaved: (next: SavedWord[]) => void, storySlug: string, onToast: (message: string) => void) {
  const [match, setMatch] = useState<TokenMatch | null>(null);
  const [candidates, setCandidates] = useState<TokenMatch[]>([]);
  const [clickedWord, setClickedWord] = useState("");
  const [sentenceContext, setSentenceContext] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const requestId = useRef(0);

  function openLookup(word: string, sentence: string, target: HTMLElement) {
    const id = ++requestId.current;
    restoreFocus.current = target;
    setClickedWord(word);
    setSentenceContext(sentence);
    setMatch(null);
    setCandidates([]);
    setLoading(true);
    setOpen(true);
    void findPublishedDictionaryMatches(word).then((matches) => {
      if (requestId.current !== id) return;
      const results = matches.length ? matches : findDictionaryMatches(word, DEMO_DICTIONARY);
      setCandidates(results);
      setMatch(results[0] ?? null);
    }).catch(() => {
      if (requestId.current === id) {
        const results = findDictionaryMatches(word, DEMO_DICTIONARY);
        setCandidates(results);
        setMatch(results[0] ?? null);
      }
    }).finally(() => { if (requestId.current === id) setLoading(false); });
  }

  function close() {
    setOpen(false);
    window.setTimeout(() => restoreFocus.current?.focus(), 0);
  }

  const selectedMeaning = match?.form?.meaning || match?.entry.meaning || "";
  const wordKey = match ? `${match.entry.pealim_id}:${match.form?.form_id || "lemma"}:${selectedMeaning.normalize("NFKC").toLocaleLowerCase()}` : "";
  const isSaved = wordKey ? saved.some((entry) => entry.key === wordKey) : false;

  function saveCurrentWord() {
    if (!match) return;
    const existing = saved.find((entry) => entry.key === wordKey);
    if (existing) {
      if (existing.sentence !== sentenceContext) updateSaved(saved.map((entry) => entry.key === wordKey ? { ...entry, sentence: sentenceContext, story: storySlug } : entry));
      onToast("Word saved with its latest context");
      return;
    }
    updateSaved([{ key: wordKey, entryId: match.entry.pealim_id, surface: clickedWord, formId: match.form?.form_id ?? null, sentence: sentenceContext, story: storySlug, meaning: match.form?.meaning || match.entry.meaning, headword: match.entry.word }, ...saved]);
    onToast("Added to your words");
  }

  return { match, candidates, clickedWord, sentenceContext, open, loading, isSaved, openLookup, close, setMatch, saveCurrentWord };
}

export function WordSheet({ lookup }: { lookup: ReturnType<typeof useWordLookup> }) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const { open, close, clickedWord, sentenceContext, candidates, match, setMatch, loading, saveCurrentWord, isSaved } = lookup;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "Tab") {
        const focusable = sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [href], input:not(:disabled)');
        if (!focusable?.length) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.setTimeout(() => sheetRef.current?.querySelector<HTMLElement>("button")?.focus(), 0);
    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("has-sheet");
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.classList.remove("has-sheet"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={sheetRef} className="lookup-sheet" role="dialog" aria-modal="true" aria-labelledby="lookup-title">
      <div className="sheet-grabber" />
      <div className="sheet-heading"><div><span className="sheet-eyebrow">YOUR HEBREW DICTIONARY</span><h2 id="lookup-title">Word explorer</h2></div><button className="sheet-close" onClick={close} aria-label="Close word explorer"><X size={18} /></button></div>
      <div className="clicked-context"><span>YOU SELECTED</span><span className="clicked-surface" lang="he" dir="rtl">{clickedWord}</span><span className="context-quote" lang="he" dir="rtl">{sentenceContext}</span></div>
      {candidates.length > 1 && <div className="lookup-candidates" aria-label="Dictionary matches">{candidates.map((candidate) => <button key={`${candidate.entry.pealim_id}:${candidate.form?.form_id || "lemma"}`} aria-pressed={match === candidate} className={match === candidate ? "candidate-active" : ""} onClick={() => setMatch(candidate)}><span lang="he" dir="rtl">{candidate.entry.word_with_nekudot}</span><small>{candidate.form?.meaning || candidate.entry.meaning} · {candidate.entry.part_of_speech}</small></button>)}</div>}
      {match ? <MatchDetails match={match} surface={clickedWord} onSave={saveCurrentWord} saved={isSaved} />
        : loading ? <div className="lookup-loading" role="status"><span className="loading-spinner" />Searching the dictionary…</div>
        : <div className="no-match"><div className="no-match-icon"><Search size={18} /></div><strong>No dictionary match yet</strong><p>Your sentence translation is still available above. Names, abbreviations and some spellings may not have a dictionary entry.</p><button onClick={close}>Back to reading</button></div>}
      <div className="dictionary-source"><span className="source-dot" />{match?.source === "hebrewtime" ? "HEBREWTIME DICTIONARY" : "ORIGINAL SAMPLE DICTIONARY"}</div>
    </section>
  </div>;
}
