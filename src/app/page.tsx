import Link from "next/link";
import { Clock3, Sparkles } from "lucide-react";
import { EDITION_STORIES, NEWS_STORIES, categoryLabel } from "@/lib/content";
import { StoryCover } from "@/components/StoryCover";
import StoryReader from "@/components/StoryReader";

export default function Home() {
  const [lead, ...rest] = EDITION_STORIES;
  const today = lead?.date ?? "";

  return <main className="content-wrap">
    <section className="welcome-row">
      <div className="eyebrow"><span className="eyebrow-line" /> {today.toUpperCase()}</div>
      <h1>A clearer kind<br className="desktop-break" /> of daily <span>reading.</span></h1>
      <p className="welcome-sub">Today&apos;s Hebrew, with a little help along the way.</p>
    </section>

    <div className="sample-banner">
      <span className="sample-icon"><Sparkles size={14} /></span>
      <span><strong>{NEWS_STORIES.length ? "News edition" : "Sample edition"}</strong> · {NEWS_STORIES.length ? "Real publisher reports, adapted for learners · Tap a story to read and explore its Hebrew." : "Invented practice stories."}</span>
    </div>

    <div className="edition-heading">
      <div className="section-label"><span className="section-number">01</span><span>THE DAILY EDITION</span></div>
      <span className="edition-meta">{EDITION_STORIES.length} STORIES <span>·</span> ABOUT {EDITION_STORIES.reduce((total, story) => total + story.minutes, 0)} MIN</span>
    </div>

    {lead && <div className="edition-layout">
      <StoryReader story={lead} />
      <div className="story-list" aria-label="More stories in today's edition">
        {rest.map((story) => <Link key={story.slug} className="story-row" href={`/news/${story.slug}/`}>
          <StoryCover story={story} size="sm" />
          <span className="story-row-content">
            <span className="story-category">{categoryLabel(story)}</span>
            <span className="story-row-title" lang="he" dir="rtl">{story.titleHe}</span>
            <span className="story-row-en">{story.titleEn}</span>
          </span>
          <span className="story-duration"><Clock3 size={12} /> {story.minutes}m</span>
        </Link>)}
      </div>
    </div>}

    <footer className="page-footer">
      <span>NEWSLINGO <i>·</i> A LITTLE HEBREW, EVERY DAY</span>
      <Link href="/archive/">Browse the archive</Link>
    </footer>
  </main>;
}
