import { z } from "zod";
import type { DictionaryEntry } from "@/lib/dictionary";
import type { LearningLevel, Sentence, Story } from "@/lib/content";

/** A source is disabled by default until an operator records its reuse terms. */
export type SourcePolicy = {
  sourceId: string;
  displayName: string;
  endpoint: string;
  checkedAt: string;
  permitted: boolean;
  permittedContent: "metadata" | "snippet" | "full_text" | "licensed_text";
  attribution: string;
  evidenceReference: string;
  retentionDays: number | null;
};

export type SourceItem = {
  id: string;
  sourceId: string;
  publisher: string;
  originalUrl: string;
  publishedAt: string;
  title: string;
  evidenceText: string | null;
  syndicatedOrigin: string | null;
};

export type StoryVersion = {
  level: LearningLevel;
  titleHe: string;
  titleEn: string;
  sentences: Sentence[];
  vocabulary: Story["vocabulary"];
  questions: Story["questions"];
};

export type PublishedStory = Omit<Story, "sentences" | "vocabulary" | "questions"> & {
  sourceItems: SourceItem[];
  factBrief: string;
  versions: Record<LearningLevel, StoryVersion>;
  tokenResolutions: TokenResolution[];
  reviewStatus: "sample" | "draft" | "passed" | "held";
};

export type Edition = {
  schemaVersion: 1;
  date: string;
  timezone: "Asia/Jerusalem";
  publishedAt: string | null;
  storyIds: string[];
  status: "sample" | "draft" | "published" | "stale";
};

export type DictionarySnapshot = {
  schemaVersion: 1;
  source: "HebrewTime / Pealim";
  exportedAt: string;
  count: number;
  entries: DictionaryEntry[];
};

export type TokenResolution = {
  sentenceId: string;
  tokenIndex: number;
  surface: string;
  candidateEntryIds: number[];
  selectedEntryId: number | null;
  selectedFormId: string | null;
  status: "exact_headword" | "exact_form" | "prefix" | "ambiguous" | "unmatched";
};

export type SavedWord = {
  key: string;
  entryId: number;
  surface: string;
  formId: string | null;
  sentence: string;
  story: string;
  meaning: string;
  headword: string;
};

export type GenerationRun = {
  id: string;
  editionDate: string;
  status: "running" | "succeeded" | "failed" | "budget_exhausted";
  checkpoint: "fetch" | "cluster" | "select" | "brief" | "generate" | "dictionary" | "validate" | "publish";
  attempts: number;
  reservedUsd: number;
  actualUsd: number;
  validationErrors: string[];
  updatedAt: string;
};

export const TokenResolutionSchema = z.object({
  sentenceId: z.string().min(1),
  tokenIndex: z.number().int().nonnegative(),
  surface: z.string().min(1),
  candidateEntryIds: z.array(z.number().int().positive()),
  selectedEntryId: z.number().int().positive().nullable(),
  selectedFormId: z.string().nullable(),
  status: z.enum(["exact_headword", "exact_form", "prefix", "ambiguous", "unmatched"]),
});

export const DailyBudgetSchema = z.object({
  schemaVersion: z.literal(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  ceilingUsd: z.literal(5),
  reservedUsd: z.number().nonnegative().max(5),
  spentUsd: z.number().nonnegative().max(5),
  requestIds: z.array(z.string()),
});
