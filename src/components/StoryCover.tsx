import { CATEGORY_COLORS, categoryLabel, type Story } from "@/lib/content";

/** No publisher photos are used; each story gets a generated cover instead. */
export function StoryCover({ story, size = "md" }: { story: Story; size?: "sm" | "md" | "lg" }) {
  const color = CATEGORY_COLORS[story.category] || "#286b55";
  const initial = story.titleHe.trim()[0] || "א";
  return (
    <div className={`story-cover story-cover-${size}`} style={{ "--cover-color": color } as React.CSSProperties} aria-hidden="true">
      <span className="story-cover-glyph" lang="he">{initial}</span>
      <span className="story-cover-label">{categoryLabel(story)}</span>
    </div>
  );
}
