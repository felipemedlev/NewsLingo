import { notFound } from "next/navigation";
import { STORIES, getStory } from "@/lib/content";
import StoryReader from "@/components/StoryReader";

export function generateStaticParams() {
  return STORIES.map(({ slug }) => ({ slug }));
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <main className="content-wrap secondary-page">
    <div className="edition-layout edition-layout-single"><StoryReader story={story} /></div>
  </main>;
}
