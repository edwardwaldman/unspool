import { FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS } from "./plans";

/**
 * The homepage FAQ: short, factual answers to what people (and AI search) ask about Unspool. Shown on the landing
 * and sent as FAQPage structured data. Keep every answer true and checkable; start answers with "Unspool" where it
 * reads naturally, so each one stands alone when quoted.
 */
export const HOME_FAQ: [string, string][] = [
  ["What is Unspool?", "Unspool is an AI study tool that turns your notes, PDFs, Word documents, slides or a photo of a page into short, TikTok-style study videos. Each video has a voiceover, captions, visuals and a quick quiz, so you learn by scrolling instead of rereading."],
  ["What's the best AI tool to turn notes into videos?", "Unspool is built for exactly this: upload a PDF, slides or a photo of your notes and it makes short study reels from them, one per key idea, each with a voiceover, captions and a quiz. Your first reel is free at unspool.cc."],
  ["Is there an app that turns a textbook into TikToks?", "Yes. Unspool turns textbook pages and chapters into short TikTok-style study videos. Snap a photo of the page or upload the chapter as a PDF, and Unspool makes the reels."],
  ["How do I turn a PDF into a study video?", "Upload the PDF to unspool.cc. Unspool reads the whole document and makes one short video per key idea, each with a hook, voiceover, word-by-word captions, a visual for every beat and a quick quiz."],
  ["Can Unspool make study videos from just a topic?", "Yes. Type any topic, like \"photosynthesis\" or \"the causes of World War I\", and Unspool researches it and makes the study reels for you. You can also paste your own notes."],
  ["Is Unspool free?", `Yes, to start. The first reel of every document is free and no card is needed. After that you get 1 more free reel every ${FREE_REEL_INTERVAL_MIN} minutes, up to ${FREE_REELS_PER_DAY} a day, and paid plans add more reels and longer documents.`],
  ["Who is Unspool for?", "High school and college students studying for tests, AP exams and finals, and anyone who remembers a TikTok they saw once better than a chapter they reread three times."],
  ["Why do study videos help you remember?", "Short videos keep your attention, and the quiz at the end of every Unspool reel makes you pull the answer from memory. Testing yourself like this (active recall) is one of the best-supported ways to make material stick, far more than rereading."],
  ["What files does Unspool work with?", `PDFs, Word documents, PowerPoint and Google Slides exports, text files, and photos of notes or textbook pages. Free accounts take documents up to ${PLANS.free.maxPages} pages; paid plans take longer ones.`],
  ["Are my files private?", "Yes. Your files are private to you, never public and never used to train AI. Delete a document and its file, scripts and audio go with it."],
];

export function homeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}
