/** One public study topic: a plain-English explainer with key points, terms and a short quiz. */
export type Topic = {
  slug: string;
  title: string;
  subject: Subject;
  /** Meta description, about 150 characters. */
  blurb: string;
  summary: string[];
  points: string[];
  /** [term, definition] */
  terms: [string, string][];
  /** [question, options, index of the right option, why] */
  quiz: [string, string[], number, string][];
};

export type Subject = "Biology" | "Chemistry" | "Physics" | "Math" | "History" | "Economics" | "Psychology";
