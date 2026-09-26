import NewsLingo from "@/components/NewsLingo";
import { STORIES } from "@/lib/content";

export function generateStaticParams() {
  return STORIES.map(({ slug }) => ({ slug }));
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
	return <NewsLingo initialStory={(await params).slug} />;
}
