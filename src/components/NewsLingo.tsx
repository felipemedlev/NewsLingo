"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, Check, ChevronDown, CircleHelp, Clock3, Compass, Languages, Menu, Minus, Newspaper, Plus, Search, SlidersHorizontal, Sparkles, Volume2, X } from "lucide-react";
import { STORIES, NEWS_STORIES, EDITION_STORIES, type LearningLevel, type Story } from "@/lib/content";
import { DEMO_DICTIONARY, findDictionaryMatches, findPublishedDictionaryMatches, type TokenMatch } from "@/lib/dictionary";

type Page = "today" | "archive" | "vocabulary";
type SavedWord = { key: string; entryId: number; surface: string; formId: string | null; sentence: string; story: string; meaning: string; headword: string };

const LEVELS: { id: LearningLevel; name: string; detail: string }[] = [
  { id: "easy", name: "Easy", detail: "A2" },
  { id: "intermediate", name: "Intermediate", detail: "B1–B2" },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><span /></span>;
}

function WordText({ text, onWord }: { text: string; onWord: (word: string) => void }) {
  const bits = text.split(/([\p{Script=Hebrew}\p{M}]+(?:[־׳״'’][\p{Script=Hebrew}\p{M}]+)*)/gu);
  return <>{bits.map((bit, i) => /[\p{Script=Hebrew}]/u.test(bit)
    ? <button key={`${i}-${bit}`} type="button" className="word-tap" onClick={() => onWord(bit)} aria-label={`Look up ${bit}`} lang="he" dir="rtl">{bit}</button>
    : <span key={`${i}-${bit}`}>{bit}</span>)}</>;
}

function MatchDetails({ match, surface, onSave, saved }: { match: TokenMatch; surface: string; onSave: () => void; saved: boolean }) {
  const { entry, form } = match;
  return <>
    <div className="lookup-answer">
      <div className="lookup-wordline"><span className="lookup-vocalized" lang="he" dir="rtl">{form?.hebrew_with_nekudot || entry.word_with_nekudot}</span><button className="audio-disabled" disabled aria-label="Pronunciation audio will be added later"><Volume2 size={16} /></button></div>
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

export default function NewsLingo({ initialPage = "today", initialStory }: { initialPage?: Page; initialStory?: string }) {
  const [page, setPage] = useState<Page>(initialPage);
  const [selectedStorySlug, setSelectedStorySlug] = useState(initialStory || STORIES[0]!.slug);
  const [level, setLevel] = useState<LearningLevel>("easy");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<SavedWord[]>([]);
  const [match, setMatch] = useState<TokenMatch | null>(null);
  const [lookupCandidates, setLookupCandidates] = useState<TokenMatch[]>([]);
  const [clickedWord, setClickedWord] = useState("");
  const [sentenceContext, setSentenceContext] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [questionOpen, setQuestionOpen] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [textScale, setTextScale] = useState(1);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const restoreFocus = useRef<HTMLElement | null>(null);
  const lookupRequest = useRef(0);
  const sheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("newsl-words-v1");
      if (raw) setSaved(JSON.parse(raw) as SavedWord[]);
      const pref = localStorage.getItem("newsl-level-v1");
      if (pref === "easy" || pref === "intermediate") setLevel(pref);
      const scale = Number(localStorage.getItem("newsl-scale-v1"));
      if (scale >= 0.9 && scale <= 1.25) setTextScale(scale);
    } catch { /* Keep the reader usable if browser storage is unavailable. */ }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncLocation = () => {
      const path = window.location.pathname;
      const story = path.match(/^\/news\/([^/]+)/)?.[1];
      if (story && STORIES.some((item) => item.slug === story)) {
        setSelectedStorySlug(story);
        setPage("today");
      } else if (path.startsWith("/archive")) setPage("archive");
      else if (path.startsWith("/vocabulary")) setPage("vocabulary");
      else setPage("today");
      setLookupOpen(false);
      setMobileNav(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  useEffect(() => {
    if (!lookupOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLookupOpen(false);
        window.setTimeout(() => restoreFocus.current?.focus(), 0);
      } else if (event.key === "Tab") {
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
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("has-sheet");
    };
  }, [lookupOpen]);

  const activeStory = useMemo(() => STORIES.find((story) => story.slug === selectedStorySlug) ?? STORIES[0]!, [selectedStorySlug]);
  const storyText = activeStory.sentences[level];
  const selectedMeaning = match?.form?.meaning || match?.entry.meaning || "";
  const wordKey = match ? `${match.entry.pealim_id}:${match.form?.form_id || "lemma"}:${selectedMeaning.normalize("NFKC").toLocaleLowerCase()}` : "";
  const matchingSaved = wordKey ? saved.some((entry) => entry.key === wordKey) : false;
  const filteredStories = STORIES.filter((story) => `${story.titleHe} ${story.titleEn} ${story.category}`.toLowerCase().includes(search.toLowerCase()));

  function updateSaved(next: SavedWord[]) {
    setSaved(next);
    try { localStorage.setItem("newsl-words-v1", JSON.stringify(next)); } catch { setToast("Could not save on this device"); }
  }
  function changeLevel(next: LearningLevel) {
    setLevel(next);
    try { localStorage.setItem("newsl-level-v1", next); } catch { /* Preference remains active for this session. */ }
  }
  function chooseStory(story: Story) {
    setSelectedStorySlug(story.slug);
    setRevealed({});
    setQuestionOpen({});
    setPage("today");
    setMobileNav(false);
    window.history.pushState({}, "", `/news/${story.slug}/`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showPage(next: Page) {
    setPage(next);
    setMobileNav(false);
    const pathname = next === "today" ? "/" : `/${next}/`;
    window.history.pushState({}, "", pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openLookup(word: string, sentence: string, target: HTMLElement) {
    const requestId = ++lookupRequest.current;
    restoreFocus.current = target;
    setClickedWord(word);
    setSentenceContext(sentence);
    setMatch(null);
    setLookupCandidates([]);
    setLookupLoading(true);
    setLookupOpen(true);
    void findPublishedDictionaryMatches(word).then((matches) => {
      if (lookupRequest.current !== requestId) return;
      const demoMatches = matches.length ? [] : findDictionaryMatches(word, DEMO_DICTIONARY);
      const results = matches.length ? matches : demoMatches;
      setLookupCandidates(results);
      setMatch(results[0] ?? null);
    }).catch(() => {
      if (lookupRequest.current === requestId) {
        const results = findDictionaryMatches(word, DEMO_DICTIONARY);
        setLookupCandidates(results);
        setMatch(results[0] ?? null);
      }
    }).finally(() => {
      if (lookupRequest.current === requestId) setLookupLoading(false);
    });
  }
  function saveCurrentWord() {
    if (!match) return;
    const key = wordKey;
    const existing = saved.find((entry) => entry.key === key);
    if (existing) {
      if (existing.sentence !== sentenceContext) updateSaved(saved.map((entry) => entry.key === key ? { ...entry, sentence: sentenceContext, story: activeStory.slug } : entry));
      setToast("Word saved with its latest context");
      return;
    }
    updateSaved([{ key, entryId: match.entry.pealim_id, surface: clickedWord, formId: match.form?.form_id ?? null, sentence: sentenceContext, story: activeStory.slug, meaning: match.form?.meaning || match.entry.meaning, headword: match.entry.word }, ...saved]);
    setToast("Added to your words");
  }
  function forgetWord(key: string) {
    updateSaved(saved.filter((entry) => entry.key !== key));
    setToast("Removed from My Words");
  }
  function exportWords() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: "newsl-words-v1", words: saved }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "newsl-words.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importWords(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as { format?: string; words?: SavedWord[] };
        if (imported.format !== "newsl-words-v1" || !Array.isArray(imported.words)) throw new Error("wrong format");
        const unique = new Map([...saved, ...imported.words].map((word) => [word.key, word]));
        updateSaved([...unique.values()]); setToast("Vocabulary imported successfully");
      } catch { setToast("That file could not be imported"); }
    };
    reader.readAsText(file);
  }
  function toggleSentence(id: string) { setRevealed((current) => ({ ...current, [id]: !current[id] })); }

  const navItems: { id: Page; title: string; icon: typeof Newspaper; count?: string }[] = [
    { id: "today", title: "Today’s edition", icon: Newspaper, count: String(EDITION_STORIES.length).padStart(2, "0") },
    { id: "archive", title: "Story archive", icon: Compass },
    { id: "vocabulary", title: "My words", icon: Bookmark, count: saved.length ? String(saved.length).padStart(2, "0") : undefined },
  ];
  const currentNav = page === "today" ? "today" : page;

  return <div className="app-shell">
    <aside inert={lookupOpen} className={`sidebar${mobileNav ? " sidebar-open" : ""}`}>
      <button className="brand-lockup" type="button" onClick={() => showPage("today")} aria-label="NewsLingo home"><BrandMark /><span>newslingo<span className="brand-period">.</span></span></button>
      <div className="sidebar-caption">YOUR READING DESK</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ id, title, icon: Icon, count }) => <button className={`nav-item${currentNav === id ? " nav-active" : ""}`} key={id} onClick={() => showPage(id)}><Icon size={17} strokeWidth={currentNav === id ? 2.2 : 1.8} /><span>{title}</span>{count && <span className="nav-count">{count}</span>}</button>)}
      </nav>
      <div className="sidebar-rule" />
      <button className="sidebar-goal" onClick={() => setToast("Your daily reading streak begins with today’s lesson.")}><div className="goal-icon"><Sparkles size={17} /></div><span className="goal-copy"><strong>Your daily practice</strong><span>A little Hebrew, every day</span></span><ArrowRight className="goal-arrow" size={15} /></button>
      <div className="sidebar-spacer" />
      <div className="sidebar-bottom"><div className="sidebar-dot" /><span>Made for curious minds</span><span className="sidebar-hebrew" lang="he" dir="rtl">עברית</span></div>
    </aside>

    {mobileNav && <button className="mobile-nav-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

    <div inert={lookupOpen} className="main-column">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="breadcrumb"><span>LEARNING DESK</span><ArrowRight size={13} /><strong>{page === "today" ? "TODAY" : page === "archive" ? "ARCHIVE" : "MY WORDS"}</strong></div>
        <div className="topbar-actions"><span className="today-stamp"><span className="live-dot" /> {EDITION_STORIES[0].date}</span><button className={`icon-button${searchOpen ? " icon-selected" : ""}`} aria-label="Search lessons" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></button><button className="icon-button filter-button" aria-label="Reader display settings" onClick={() => { const size = textScale >= 1.2 ? 1 : +(textScale + .1).toFixed(1); setTextScale(size); try { localStorage.setItem("newsl-scale-v1", String(size)); } catch { /* Display setting stays in memory. */ } setToast(`Reading size ${Math.round(size * 100)}%`); }}><SlidersHorizontal size={17} /></button><button className="profile-chip" onClick={() => setToast("Your learning progress stays on this device.")} aria-label="Learning progress on this device"><span className="profile-avatar">L</span><span>My learning</span><ChevronDown size={13} /></button></div>
      </header>

      {searchOpen && <form className="search-panel" onSubmit={(event) => { event.preventDefault(); if (filteredStories[0]) chooseStory(filteredStories[0]); }}><Search size={17} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stories, topics, words…" aria-label="Search stories" /><span>{filteredStories.length} stories</span><button type="button" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearch(""); }}><X size={16} /></button>{search && <div className="search-results">{filteredStories.length === 0 && <p className="search-empty" role="status">No stories found. Try another word or topic.</p>}{filteredStories.map((story) => <button type="button" key={story.slug} onClick={() => { chooseStory(story); setSearchOpen(false); setSearch(""); }}><span lang="he" dir="rtl">{story.titleHe}</span><small>{story.titleEn}</small></button>)}</div>}</form>}

      {page === "today" && <main className="content-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {EDITION_STORIES[0].date.toUpperCase()}</div><h1>A clearer kind<br className="desktop-break" /> of daily <span>reading.</span></h1><p className="welcome-sub">Today’s Hebrew, with a little help along the way.</p></div><div className="streak-card"><div className="streak-spark">✳</div><div><strong>Small steps add up.</strong><span>Your next few minutes are yours.</span></div><ArrowUpRight size={16} /></div></section>

        <div className="sample-banner"><span className="sample-icon"><Sparkles size={14} /></span><span><strong>{NEWS_STORIES.length ? "News edition" : "Sample edition"}</strong> · {NEWS_STORIES.length ? "Real publisher reports · Tap a story to read and explore its Hebrew." : "Invented practice stories."}</span></div>

        <div className="edition-heading"><div className="section-label"><span className="section-number">01</span><span>THE DAILY EDITION</span></div><span className="edition-meta">{EDITION_STORIES.length} STORIES <span>·</span> ABOUT {EDITION_STORIES.reduce((total, story) => total + story.minutes, 0)} MIN</span></div>

        <div className="edition-layout">
          <div className="story-list" aria-label="Stories in today’s edition">{EDITION_STORIES.map((story, index) => <button key={story.slug} className={`story-row${story.slug === activeStory.slug ? " story-row-active" : ""}`} onClick={() => chooseStory(story)} aria-current={story.slug === activeStory.slug ? "true" : undefined}><span className="story-index">{String(index + 1).padStart(2, "0")}</span><span className="story-row-content"><span className="story-category">{story.category}</span><span className="story-row-title" lang="he" dir="rtl">{story.titleHe}</span><span className="story-row-en">{story.titleEn}</span></span><span className="story-duration"><Clock3 size={12} /> {story.minutes}m</span></button>)}</div>

          <article className="reader-card">
            <div className="reader-top"><div className="reader-category"><span /> {activeStory.category} <span className="reader-meta-dot">·</span> <Clock3 size={12} /> {activeStory.minutes} MIN READ</div><button className="reader-more" aria-label="Reader settings" onClick={() => { const size = textScale >= 1.2 ? 1 : +(textScale + .1).toFixed(1); setTextScale(size); try { localStorage.setItem("newsl-scale-v1", String(size)); } catch {} setToast(`Reading size ${Math.round(size * 100)}%`); }}><SlidersHorizontal size={15} /></button></div>
            <h2 className="story-headline" lang="he" dir="rtl">{activeStory.titleHe}</h2>
            <div className="headline-translation">{activeStory.titleEn}</div>
            <div className="story-byline"><span className="byline-flower">✳</span><span>{activeStory.source?.publisher || "ORIGINAL PRACTICE STORY"}</span><span>·</span><span>{activeStory.source ? `${activeStory.date} · ${activeStory.source.adapted ? "AI-ADAPTED" : "ORIGINAL HEADLINE"}` : "NOT LIVE NEWS"}</span></div>
            <div className="reader-divider" />
            <div className="level-header"><span>CHOOSE YOUR READING LEVEL</span><button className="level-help" onClick={() => setToast("Easy is for shorter, simpler reading. Intermediate follows more natural news-style Hebrew.")} aria-label="About reading levels"><CircleHelp size={15} /></button></div>
            <div className="level-picker" role="tablist" aria-label="Reading level">{LEVELS.map((item) => <button key={item.id} role="tab" aria-selected={level === item.id} className={`level-option${level === item.id ? " level-option-active" : ""}`} onClick={() => changeLevel(item.id)}><span className="level-radio">{level === item.id && <span />}</span><span className="level-name">{item.name}</span><span className="level-tag">{item.detail}</span></button>)}</div>

            <div className="reading-note"><Languages size={14} /><span>Tap any <strong>Hebrew word</strong> to see its dictionary meaning.</span><span className="reading-note-he" lang="he" dir="rtl">עברית · English</span></div>
            <div className="sentences" style={{ "--text-scale": textScale } as React.CSSProperties}>
              {storyText.map((sentence, index) => <div className={`sentence-row${revealed[sentence.id] ? " sentence-revealed" : ""}`} key={`${activeStory.slug}-${level}-${sentence.id}`}><div className="sentence-number">{String(index + 1).padStart(2, "0")}</div><div className="sentence-body"><div className="bilingual-copy"><p className="hebrew-sentence" lang="he" dir="rtl">{sentence.he.split(/\s+/).map((word, i) => <span key={`${i}-${word}`}>{i > 0 && " "}<WordText text={word} onWord={(value) => openLookup(value, sentence.he, document.activeElement as HTMLElement)} /></span>)}</p><p className="english-sentence">{sentence.en}</p></div><div className="translation-control"><button className={`translation-toggle${revealed[sentence.id] ? " translation-open" : ""}`} onClick={() => toggleSentence(sentence.id)} aria-expanded={Boolean(revealed[sentence.id])}><span>{revealed[sentence.id] ? <ArrowDown size={13} /> : <ArrowRight size={13} />}{revealed[sentence.id] ? "Hide translation" : "Reveal translation"}</span><span className="translation-toggle-en">{revealed[sentence.id] ? "HIDE" : "EN"}</span></button></div></div></div>)}
            </div>

            <div className="reader-divider reader-divider-bottom" />
            <div className="story-vocab-head"><span>WORDS TO NOTICE</span><span>{activeStory.vocabulary.length} WORDS</span></div>
            <div className="story-vocab-list">{activeStory.vocabulary.map((word) => { return <button key={word.he} className="vocab-chip" onClick={(event) => openLookup(word.he, storyText.map((s) => s.he).find((s) => s.includes(word.he)) || word.he, event.currentTarget)}><span lang="he" dir="rtl">{word.he}</span><span>{word.en}</span><Plus size={13} /></button>; })}</div>

            <section className="comprehension"><div className="comprehension-heading"><span><Check size={15} /> CHECK YOUR UNDERSTANDING</span><span>{activeStory.questions.length} QUESTIONS</span></div>{activeStory.questions.map((question, index) => <div className="question-row" key={question.prompt}><button onClick={() => setQuestionOpen((current) => ({ ...current, [question.prompt]: !current[question.prompt] }))} aria-expanded={Boolean(questionOpen[question.prompt])}><span><b>{index + 1}</b>{question.prompt}</span>{questionOpen[question.prompt] ? <Minus size={15} /> : <Plus size={15} />}</button>{questionOpen[question.prompt] && <p>{question.answer}</p>}</div>)}</section>

            <div className="story-footer"><span><span className="footer-seal">✳</span> {activeStory.source ? `${activeStory.source.publisher} · ${activeStory.source.adapted ? "AI-adapted learning version" : "Original Hebrew headline"}` : "Original learning content · Demo"}</span>{activeStory.source ? <a href={activeStory.source.url} target="_blank" rel="noopener noreferrer">Read original report <ArrowUpRight size={13} /></a> : <span>Practice story</span>}</div>
          </article>
        </div>
        <footer className="page-footer"><span>NEWSLINGO <i>·</i> A LITTLE HEBREW, EVERY DAY</span><button onClick={() => setToast("News lessons are adapted from publisher feed briefs using AI. Read the linked original report for full context.")}>How stories work <ArrowUpRight size={13} /></button></footer>
      </main>}

      {page === "archive" && <main className="content-wrap secondary-page"><div className="eyebrow"><span className="eyebrow-line" /> YOUR READING HISTORY</div><h1>A little story,<br /> <span>every day.</span></h1><p className="welcome-sub">Find a familiar word in a new context.</p><div className="sample-banner"><span className="sample-icon"><Sparkles size={14} /></span><span><strong>Reading archive</strong> · News reports and labeled practice stories.</span></div><div className="archive-heading"><span>ALL STORIES</span><span>{STORIES.length} STORIES</span></div><div className="archive-grid">{STORIES.map((story, i) => <button className="archive-card" key={story.slug} onClick={() => chooseStory(story)}><span className="archive-card-top"><span>{story.category}</span><span>{String(i + 1).padStart(2, "0")}</span></span><strong lang="he" dir="rtl">{story.titleHe}</strong><span>{story.titleEn}</span><span className="archive-card-bottom">{story.date} <i>·</i> {story.minutes} MIN <ArrowUpRight size={14} /></span></button>)}</div></main>}

      {page === "vocabulary" && <main className="content-wrap secondary-page"><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL COLLECTION</div><h1>Your words,<br /><span>your pace.</span></h1><p className="welcome-sub">Save the words you meet. See them again in context.</p><div className="sample-banner"><span className="sample-icon"><BookmarkCheck size={14} /></span><span><strong>Saved on this device only</strong> · Export your words to keep a backup or move devices.</span></div><div className="saved-toolbar"><div><strong>{saved.length} {saved.length === 1 ? "word" : "words"}</strong><span> Collected from your reading</span></div><div className="saved-actions"><label className="outline-action">Import words<input type="file" accept="application/json,.json" onChange={(event) => { importWords(event.target.files?.[0]); event.target.value = ""; }} /></label><button className="outline-action" onClick={exportWords} disabled={!saved.length}>Export words <ArrowUpRight size={13} /></button></div></div>{saved.length ? <div className="saved-grid">{saved.map((word) => <article key={word.key} className="saved-card"><div className="saved-card-top"><span>SAVED WORD</span><button onClick={() => forgetWord(word.key)} aria-label={`Remove ${word.headword}`}><X size={15} /></button></div><div className="saved-card-he" lang="he" dir="rtl">{word.surface}</div><div className="saved-card-lemma" lang="he" dir="rtl">{word.headword}</div><strong>{word.meaning}</strong><p lang="he" dir="rtl">“{word.sentence}”</p><button className="context-link" onClick={() => { const story = STORIES.find((item) => item.slug === word.story); if (story) chooseStory(story); }}><span>From {STORIES.find((story) => story.slug === word.story)?.titleEn || "your reading"}</span><ArrowUpRight size={13} /></button></article>)}</div> : <div className="empty-words"><span className="empty-bookmark"><Bookmark size={23} /></span><strong>A good word is worth keeping.</strong><span>Tap any Hebrew word in a story and save it here.<br />It will be waiting when you come back.</span><button onClick={() => showPage("today")}>Read today’s edition <ArrowRight size={14} /></button></div>}<p className="device-note">Your vocabulary is stored in this browser. Export a backup before changing devices or clearing site data.</p></main>}

      <nav className="mobile-tabbar" aria-label="Mobile navigation">{navItems.map(({ id, title, icon: Icon }) => <button key={id} className={currentNav === id ? "mobile-tab-active" : ""} onClick={() => showPage(id)}><Icon size={19} /><span>{id === "today" ? "Today" : id === "archive" ? "Archive" : "My words"}</span></button>)}</nav>
    </div>

      {lookupOpen && <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setLookupOpen(false); window.setTimeout(() => restoreFocus.current?.focus(), 0); } }}><section ref={sheetRef} className="lookup-sheet" role="dialog" aria-modal="true" aria-labelledby="lookup-title"><div className="sheet-grabber" /><div className="sheet-heading"><div><span className="sheet-eyebrow">YOUR HEBREW DICTIONARY</span><h2 id="lookup-title">Word explorer</h2></div><button className="sheet-close" onClick={() => { setLookupOpen(false); window.setTimeout(() => restoreFocus.current?.focus(), 0); }} aria-label="Close word explorer"><X size={18} /></button></div><div className="clicked-context"><span>YOU SELECTED</span><span className="clicked-surface" lang="he" dir="rtl">{clickedWord}</span><span className="context-quote" lang="he" dir="rtl">{sentenceContext}</span></div>{lookupCandidates.length > 1 && <div className="lookup-candidates" aria-label="Dictionary matches">{lookupCandidates.map((candidate) => <button key={`${candidate.entry.pealim_id}:${candidate.form?.form_id || "lemma"}`} aria-pressed={match === candidate} className={match === candidate ? "candidate-active" : ""} onClick={() => setMatch(candidate)}><span lang="he" dir="rtl">{candidate.entry.word_with_nekudot}</span><small>{candidate.form?.meaning || candidate.entry.meaning} · {candidate.entry.part_of_speech}</small></button>)}</div>}{match ? <MatchDetails match={match} surface={clickedWord} onSave={saveCurrentWord} saved={matchingSaved} /> : lookupLoading ? <div className="lookup-loading" role="status"><span className="loading-spinner" />Searching the dictionary…</div> : <div className="no-match"><div className="no-match-icon"><Search size={18} /></div><strong>No dictionary match yet</strong><p>Your sentence translation is still available above. Names, abbreviations and some spellings may not have a dictionary entry.</p><button onClick={() => setLookupOpen(false)}>Back to reading</button></div>}<div className="dictionary-source"><span className="source-dot" />{match?.source === "hebrewtime" ? "HEBREWTIME DICTIONARY" : "ORIGINAL SAMPLE DICTIONARY"}</div></section></div>}
    {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
  </div>;
}
