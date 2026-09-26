"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, X } from "lucide-react";
import { getStory } from "@/lib/content";
import { useSavedWords, type SavedWord } from "@/lib/useLocalPrefs";
import { useToast } from "@/lib/useToast";

export default function Vocabulary() {
  const [saved, updateSaved] = useSavedWords();
  const [toast, setToast] = useToast();

  function forgetWord(key: string) {
    updateSaved(saved.filter((entry) => entry.key !== key));
    setToast("Removed from My Words");
  }
  function exportWords() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: "newsl-words-v1", words: saved }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "newsl-words.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importWords(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as { format?: string; words?: SavedWord[] };
        if (imported.format !== "newsl-words-v1" || !Array.isArray(imported.words)) throw new Error("wrong format");
        const unique = new Map([...saved, ...imported.words].map((word) => [word.key, word]));
        updateSaved([...unique.values()]);
        setToast("Vocabulary imported successfully");
      } catch { setToast("That file could not be imported"); }
    };
    reader.readAsText(file);
  }

  return <main className="content-wrap secondary-page">
    <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL COLLECTION</div>
    <h1>Your words,<br /><span>your pace.</span></h1>
    <p className="welcome-sub">Save the words you meet. See them again in context.</p>

    <div className="sample-banner"><span className="sample-icon"><BookmarkCheck size={14} /></span><span><strong>Saved on this device only</strong> · Export your words to keep a backup or move devices.</span></div>

    <div className="saved-toolbar">
      <div><strong>{saved.length} {saved.length === 1 ? "word" : "words"}</strong><span> Collected from your reading</span></div>
      <div className="saved-actions">
        <label className="outline-action">Import words<input type="file" accept="application/json,.json" onChange={(event) => { importWords(event.target.files?.[0]); event.target.value = ""; }} /></label>
        <button className="outline-action" onClick={exportWords} disabled={!saved.length}>Export words <ArrowUpRight size={13} /></button>
      </div>
    </div>

    {saved.length ? <div className="saved-grid">{saved.map((word) => {
      const story = getStory(word.story);
      return <article key={word.key} className="saved-card">
        <div className="saved-card-top"><span>SAVED WORD</span><button onClick={() => forgetWord(word.key)} aria-label={`Remove ${word.headword}`}><X size={15} /></button></div>
        <div className="saved-card-he" lang="he" dir="rtl">{word.surface}</div>
        <div className="saved-card-lemma" lang="he" dir="rtl">{word.headword}</div>
        <strong>{word.meaning}</strong>
        <p lang="he" dir="rtl">“{word.sentence}”</p>
        {story && <Link className="context-link" href={`/news/${story.slug}/`}><span>From {story.titleEn}</span><ArrowUpRight size={13} /></Link>}
      </article>;
    })}</div> : <div className="empty-words">
      <span className="empty-bookmark"><Bookmark size={23} /></span>
      <strong>A good word is worth keeping.</strong>
      <span>Tap any Hebrew word in a story and save it here.<br />It will be waiting when you come back.</span>
      <Link href="/">Read today&apos;s edition <ArrowRight size={14} /></Link>
    </div>}
    <p className="device-note">Your vocabulary is stored in this browser. Export a backup before changing devices or clearing site data.</p>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
