"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Clock3, Languages, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { categoryLabel, groupParagraphs, type LearningLevel, type Story } from "@/lib/content";
import { useReaderLevel, useSavedWords, useTextScale } from "@/lib/useLocalPrefs";
import { useToast } from "@/lib/useToast";
import { useWordLookup, WordSheet, WordText } from "@/components/WordSheet";

const LEVELS: { id: LearningLevel; name: string; detail: string }[] = [
  { id: "easy", name: "Easy", detail: "A2" },
  { id: "intermediate", name: "Intermediate", detail: "B1–B2" },
];

export default function StoryReader({ story }: { story: Story }) {
  const [level, changeLevel] = useReaderLevel();
  const [textScale, cycleScale] = useTextScale();
  const [saved, updateSaved] = useSavedWords();
  const [toast, setToast] = useToast();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [allRevealed, setAllRevealed] = useState(false);
  const [questionOpen, setQuestionOpen] = useState<Record<string, boolean>>({});
  const lookup = useWordLookup(saved, updateSaved, story.slug, setToast);

  const storyText = story.sentences[level];
  const paragraphs = groupParagraphs(storyText);

  function toggleSentence(id: string) { setRevealed((current) => ({ ...current, [id]: !current[id] })); }
  function onChangeLevel(next: LearningLevel) { changeLevel(next); setRevealed({}); setAllRevealed(false); setQuestionOpen({}); }

  return <article className="reader-card">
    <div className="reader-top">
      <div className="reader-category"><span /> {categoryLabel(story)} <span className="reader-meta-dot">·</span> <Clock3 size={12} /> {story.minutes} MIN READ</div>
      <button className="reader-more" aria-label="Increase reading text size" onClick={() => setToast(`Reading size ${Math.round(cycleScale() * 100)}%`)}><SlidersHorizontal size={15} /></button>
    </div>
    <h1 className="story-headline" lang="he" dir="rtl">{story.titleHe}</h1>
    <div className="headline-translation">{story.titleEn}</div>
    <p className="story-standfirst">{story.standfirstEn || story.standfirst}</p>
    <div className="story-byline">
      <span className="byline-flower">✳</span>
      <span>{story.source?.publisher || "ORIGINAL PRACTICE STORY"}</span>
      <span>·</span>
      <span>{story.source ? `${story.date} · ${story.source.adapted ? "AI-adapted from the full report" : "ORIGINAL HEADLINE"}` : "NOT LIVE NEWS"}</span>
    </div>
    <div className="reader-divider" />

    <div className="level-header"><span>CHOOSE YOUR READING LEVEL</span></div>
    <div className="level-picker" role="tablist" aria-label="Reading level">
      {LEVELS.map((item) => <button key={item.id} role="tab" aria-selected={level === item.id} className={`level-option${level === item.id ? " level-option-active" : ""}`} onClick={() => onChangeLevel(item.id)}><span className="level-radio">{level === item.id && <span />}</span><span className="level-name">{item.name}</span><span className="level-tag">{item.detail}</span></button>)}
    </div>

    <div className="reading-note">
      <Languages size={14} /><span>Tap any <strong>Hebrew word</strong> to see its dictionary meaning.</span>
      <button className="reveal-all-toggle" onClick={() => setAllRevealed((value) => !value)}>{allRevealed ? "Hide all translations" : "Show all translations"}</button>
    </div>

    <div className="sentences" style={{ "--text-scale": textScale } as React.CSSProperties}>
      {paragraphs.map((paragraph, pIndex) => <div className="paragraph" key={pIndex}>
        {paragraph.map((sentence, index) => {
          const isRevealed = allRevealed || Boolean(revealed[sentence.id]);
          return <div className={`sentence-row${isRevealed ? " sentence-revealed" : ""}`} key={`${story.slug}-${level}-${sentence.id}`}>
            <div className="sentence-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="sentence-body">
              <div className="bilingual-copy">
                <p className="hebrew-sentence" lang="he" dir="rtl">{sentence.he.split(/\s+/).map((word, i) => <span key={`${i}-${word}`}>{i > 0 && " "}<WordText text={word} onWord={(value, target) => lookup.openLookup(value, sentence.he, target)} /></span>)}</p>
                <p className="english-sentence">{sentence.en}</p>
              </div>
              {!allRevealed && <div className="translation-control">
                <button className={`translation-toggle${revealed[sentence.id] ? " translation-open" : ""}`} onClick={() => toggleSentence(sentence.id)} aria-expanded={Boolean(revealed[sentence.id])}>
                  <span>{revealed[sentence.id] ? "Hide translation" : "Reveal translation"}</span>
                  <span className="translation-toggle-en">{revealed[sentence.id] ? "HIDE" : "EN"}</span>
                </button>
              </div>}
            </div>
          </div>;
        })}
      </div>)}
    </div>

    <div className="reader-divider reader-divider-bottom" />
    <div className="story-vocab-head"><span>WORDS TO NOTICE</span><span>{story.vocabulary.length} WORDS</span></div>
    <div className="story-vocab-list">{story.vocabulary.map((word) => <button key={word.he} className="vocab-chip" onClick={(event) => lookup.openLookup(word.he, storyText.map((s) => s.he).find((s) => s.includes(word.he)) || word.he, event.currentTarget)}><span lang="he" dir="rtl">{word.he}</span><span>{word.en}</span><Plus size={13} /></button>)}</div>

    {story.questions.length > 0 && <section className="comprehension">
      <div className="comprehension-heading"><span><Check size={15} /> CHECK YOUR UNDERSTANDING</span><span>{story.questions.length} QUESTIONS</span></div>
      {story.questions.map((question, index) => <div className="question-row" key={question.prompt}>
        <button onClick={() => setQuestionOpen((current) => ({ ...current, [question.prompt]: !current[question.prompt] }))} aria-expanded={Boolean(questionOpen[question.prompt])}><span><b>{index + 1}</b>{question.prompt}</span>{questionOpen[question.prompt] ? <Minus size={15} /> : <Plus size={15} />}</button>
        {questionOpen[question.prompt] && <p>{question.answer}</p>}
      </div>)}
    </section>}

    <div className="story-footer">
      <span><span className="footer-seal">✳</span> {story.source ? `${story.source.publisher} · ${story.source.adapted ? "AI-adapted learning version" : "Original Hebrew headline"}` : "Original learning content · Demo"}</span>
      {story.source ? <a href={story.source.url} target="_blank" rel="noopener noreferrer">Read original report <ArrowUpRight size={13} /></a> : <span>Practice story</span>}
    </div>

    <WordSheet lookup={lookup} />
    {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
  </article>;
}
