"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { STORIES, categoryLabel } from "@/lib/content";
import { StoryCover } from "@/components/StoryCover";

export default function Archive() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return STORIES;
    return STORIES.filter((story) => `${story.titleHe} ${story.titleEn} ${story.category} ${story.standfirstEn ?? story.standfirst}`.toLowerCase().includes(query));
  }, [search]);

  return <main className="content-wrap secondary-page">
    <div className="eyebrow"><span className="eyebrow-line" /> STORY ARCHIVE</div>
    <h1>A little story,<br /> <span>every day.</span></h1>
    <p className="welcome-sub">Find a familiar word in a new context.</p>

    <div className="sample-banner"><span className="sample-icon"><Sparkles size={14} /></span><span><strong>Reading archive</strong> · News reports and labeled practice stories.</span></div>

    <form className="archive-search" onSubmit={(event) => event.preventDefault()}>
      <Search size={16} />
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stories, topics, words…" aria-label="Search stories" />
    </form>

    <div className="archive-heading"><span>ALL STORIES</span><span>{filtered.length} STORIES</span></div>
    {filtered.length === 0 && <p className="search-empty" role="status">No stories found. Try another word or topic.</p>}
    <div className="archive-grid">
      {filtered.map((story) => <Link className="archive-card" key={story.slug} href={`/news/${story.slug}/`}>
        <StoryCover story={story} size="md" />
        <span className="archive-card-top"><span>{categoryLabel(story)}</span></span>
        <strong lang="he" dir="rtl">{story.titleHe}</strong>
        <span>{story.titleEn}</span>
        <span className="archive-card-bottom">{story.date} <i>·</i> {story.minutes} MIN <ArrowUpRight size={14} /></span>
      </Link>)}
    </div>
  </main>;
}
