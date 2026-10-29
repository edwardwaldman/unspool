import { HUMANITIES } from "./humanities";
import { SCIENCE } from "./science";
import type { Subject, Topic } from "./types";

export type { Subject, Topic };

/** Every public /learn topic, in display order. */
export const TOPICS: Topic[] = [...SCIENCE, ...HUMANITIES];
export const SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "Math", "History", "Economics", "Psychology"];

export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);

/** Up to n other topics from the same subject, then from others, for internal links. */
export function relatedTopics(t: Topic, n = 4): Topic[] {
  const same = TOPICS.filter((x) => x.subject === t.subject && x.slug !== t.slug);
  const other = TOPICS.filter((x) => x.subject !== t.subject);
  return [...same, ...other].slice(0, n);
}
