import { FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS } from "./plans";

// Public guide pages for what students search ("pdf to video", "how to study a textbook fast"…).
// Every claim here must match what the product actually does.

export type Guide = {
  slug: string;
  /** Page title (also the H1). */
  title: string;
  /** Meta description, about 150 characters. */
  blurb: string;
  label: string;
  intro: string[];
  steps: [string, string][];
  why: { heading: string; body: string[] };
  faqs: [string, string][];
  /** Topic slugs to link to. */
  topics: string[];
};

const FREE = `Your first reel of every document is free. After that, another free reel unlocks every ${FREE_REEL_INTERVAL_MIN} minutes, up to ${FREE_REELS_PER_DAY} a day. Paid plans add more reels and longer documents.`;
const FILES = "PDF, Word (.docx), PowerPoint (.pptx), plain text or Markdown, and photos (PNG, JPG or WebP).";
const PAGES = `Up to ${PLANS.free.maxPages} pages on the free plan, and up to ${PLANS.ultra.maxPages} on paid plans.`;
const ACCURACY = "Reels are written only from your document, so they stick to what your class actually covers. They're still summaries, so check anything high-stakes against the original.";

export const GUIDES: Guide[] = [
  {
    slug: "pdf-to-video",
    title: "Turn a PDF into short study videos",
    blurb: "Turn any PDF, like a textbook chapter, lecture slides or notes, into short narrated study videos with captions and a quiz. Free to start.",
    label: "PDF to video",
    intro: [
      "Reading a 40-page PDF is slow, and most of it doesn't stick. Unspool turns a PDF into a set of short videos, one per key idea, that you can watch like reels.",
      "Each video has a hook, a natural voiceover, word-by-word captions, a visual for every point and a quick quiz at the end, so you know it actually stuck.",
    ],
    steps: [
      ["Upload your PDF", "A textbook chapter, lecture slides saved as PDF, a study guide or your notes."],
      ["Unspool reads all of it", "It plans one short reel per key idea, in order, covering the whole document."],
      ["Watch and quiz yourself", "Swipe through the reels. Every one ends with a question so you test yourself as you go."],
    ],
    why: {
      heading: "Why videos beat rereading a PDF",
      body: [
        "Rereading feels productive, but it mostly builds familiarity, not memory. Short explanations followed by a question make you recall the idea, and recalling is what makes it last.",
        "Breaking a long PDF into one idea per reel also makes it easier to start, and easier to review a few minutes at a time over several days, which beats one long cram.",
      ],
    },
    faqs: [
      ["Is it free?", FREE],
      ["What files work besides PDF?", FILES],
      ["How long can the PDF be?", PAGES],
      ["Is it accurate?", ACCURACY],
    ],
    topics: ["forgetting-curve", "photosynthesis", "supply-and-demand", "newtons-laws"],
  },
  {
    slug: "notes-to-video",
    title: "Turn your notes into study videos",
    blurb: "Turn class notes, typed or as a photo, into short narrated study videos with captions and a quiz in each one. Review your notes like reels.",
    label: "Notes to video",
    intro: [
      "Your notes already have everything you need for the test. The problem is actually going back through them. Unspool turns your notes into short study videos you can scroll through.",
      "Upload typed notes or a photo of handwritten ones. Each key idea becomes a short reel with a voiceover, captions, visuals and a quiz question.",
    ],
    steps: [
      ["Add your notes", "A Word doc, a text file, a PDF, or a photo of a notebook page."],
      ["Get a reel per idea", "Unspool turns each key idea into a short reel, in the order you wrote them."],
      ["Review in minutes", "Watch a few reels between classes and answer the quiz at the end of each one."],
    ],
    why: {
      heading: "Why it helps you remember",
      body: [
        "Notes you never look at again don't help much. Short, frequent reviews spread over several days are one of the best-supported ways to keep information in memory.",
        "Answering a question after each reel is retrieval practice: pulling the answer out of your own head, which strengthens memory far more than rereading.",
      ],
    },
    faqs: [
      ["Can I use handwritten notes?", "Yes. Take a clear photo of the page and upload it. Neat handwriting and good lighting give the best results."],
      ["What files work?", FILES],
      ["Is it free?", FREE],
      ["Who can see my notes?", "Only you. Your files are private, never public, and never used to train AI. Delete a document and its files go with it."],
    ],
    topics: ["forgetting-curve", "mitosis", "classical-conditioning", "derivatives"],
  },
  {
    slug: "textbook-to-video",
    title: "Turn a textbook chapter into short videos",
    blurb: "Turn a long textbook chapter into short narrated videos, one per key idea, with captions and a quiz. Get through the reading in a fraction of the time.",
    label: "Textbook to video",
    intro: [
      "A textbook chapter can take hours to read and still feel blurry the next day. Unspool turns a chapter into a set of short videos, one for each key idea, so you can get through it in minutes and actually remember it.",
      "Upload the chapter as a PDF, or snap photos of the pages. Each reel explains one idea simply, with captions, visuals and a quiz question at the end.",
    ],
    steps: [
      ["Upload the chapter", "A PDF of the chapter, or photos of the pages."],
      ["One reel per key idea", "Definitions, processes, dates and examples, in the chapter's order."],
      ["Watch, then quiz", "Every reel ends with a question, so you find the gaps before the test does."],
    ],
    why: {
      heading: "Why short videos work for textbooks",
      body: [
        "Long reading sessions lose focus fast. Short, single-idea explanations keep attention and are easy to review again later.",
        "The quiz at the end of each reel turns passive reading into active recall, which is what makes material last until the exam.",
      ],
    },
    faqs: [
      ["How long can the chapter be?", PAGES],
      ["Can I upload photos of textbook pages?", "Yes. Upload clear photos of the pages (PNG, JPG or WebP)."],
      ["Is it free?", FREE],
      ["Is it accurate?", ACCURACY],
    ],
    topics: ["cellular-respiration", "world-war-2", "chemical-bonding", "inflation"],
  },
  {
    slug: "photo-to-study-video",
    title: "Turn a photo of any page into a study video",
    blurb: "Snap a photo of a notebook or textbook page and turn it into short study reels with a voiceover, captions and a quiz. No typing needed.",
    label: "Photo to study video",
    intro: [
      "No PDF? No problem. Take a photo of a notebook page, a handout or a textbook page, and Unspool turns it into short study reels.",
      "Each reel explains one idea from the page with a voiceover, captions and visuals, then asks you a question to check it stuck.",
    ],
    steps: [
      ["Snap the page", "Use your phone's camera: a handout, a whiteboard photo, notebook or textbook pages."],
      ["Upload it", "Unspool reads the text in the photo and plans the reels."],
      ["Swipe and learn", "Watch the reels and answer the quiz at the end of each one."],
    ],
    why: {
      heading: "Made for how students actually study",
      body: [
        "A lot of class material never becomes a neat digital file. Turning a quick photo into reels means anything you can see, you can study.",
        "Each reel ends with a quiz question, so every photo becomes a mini practice test.",
      ],
    },
    faqs: [
      ["What photo formats work?", "PNG, JPG and WebP. Clear, well-lit photos of printed text work best."],
      ["Does handwriting work?", "Neat handwriting usually works. If a page is hard to read, a typed or printed copy gives better results."],
      ["Is it free?", FREE],
      ["What other files work?", FILES],
    ],
    topics: ["pythagorean-theorem", "atomic-structure", "opportunity-cost", "operant-conditioning"],
  },
  {
    slug: "ai-study-app",
    title: "An AI study app that turns your reading into reels",
    blurb: "Unspool is an AI study app that turns PDFs, slides, notes and photos into short reels with voiceover, captions and a quiz. Study by scrolling.",
    label: "AI study app",
    intro: [
      "Unspool is a study app that turns the reading you're avoiding into short reels you'll actually watch. Upload a document and it makes one reel per key idea, with a voiceover, captions, visuals and a quiz.",
      "It's built for students: textbook chapters, lecture slides, study guides and notes. It works for work documents too.",
    ],
    steps: [
      ["Drop in a document", FILES],
      ["AI plans the reels", "It reads the whole document and turns each key idea into a short reel, in order."],
      ["Scroll and quiz", "Swipe through like a feed. A quick question at the end of each reel checks you remember it."],
    ],
    why: {
      heading: "Built on how memory works",
      body: [
        "Testing yourself and reviewing in short sessions over time are two of the most reliable study methods in learning research. Unspool builds both in: every reel is short, and every reel ends with a question.",
        "And because it feels like scrolling, it's much easier to start.",
      ],
    },
    faqs: [
      ["Is it free?", FREE],
      ["What can I upload?", FILES],
      ["Is my data private?", "Yes. Your files are private, never public, and never used to train AI."],
      ["Is it accurate?", ACCURACY],
    ],
    topics: ["forgetting-curve", "confirmation-bias", "transcription-and-translation", "gdp"],
  },
  {
    slug: "how-to-study-a-textbook-fast",
    title: "How to study a textbook fast (and actually remember it)",
    blurb: "How to study a textbook chapter fast: preview, read for the main ideas, test yourself and space your reviews. Backed by learning research.",
    label: "Study guide",
    intro: [
      "Reading a chapter start to finish and highlighting as you go feels like studying, but research shows it's one of the least effective methods. Here's a faster approach that sticks.",
      "The idea: spend less time reading and more time pulling information back out of your head.",
    ],
    steps: [
      ["Preview first (5 minutes)", "Skim the headings, bold terms, diagrams and the end-of-chapter questions. Now you know what matters."],
      ["Read for the main ideas", "Read each section once, then close the book and say or write the key point in your own words."],
      ["Test yourself", "Answer the chapter questions or make your own. Retrieval practice strengthens memory more than rereading."],
      ["Space it out", "Review for a few minutes on several different days instead of one long session. Spacing beats cramming."],
    ],
    why: {
      heading: "Why this works",
      body: [
        "Rereading and highlighting mostly build familiarity, the feeling that you know something, without the ability to recall it on a test. Testing yourself forces recall, and recall is what strengthens memory.",
        "Unspool does steps 2 to 4 for you: it turns a chapter into short reels, one per main idea, each ending with a quiz question, so reviewing over several days takes minutes.",
      ],
    },
    faqs: [
      ["Is highlighting a good way to study?", "On its own, not really. Reviews of study techniques rate highlighting as low-value. Use it to mark what to test yourself on later."],
      ["Is cramming bad?", "Cramming can get you through tomorrow's test, but you forget most of it quickly. Short reviews spread over days last much longer."],
      ["How can Unspool help?", "Upload the chapter and Unspool turns it into short reels with a quiz in each one, so you can review a chapter in minutes. " + FREE],
      ["What files work?", FILES],
    ],
    topics: ["forgetting-curve", "confirmation-bias", "maslows-hierarchy-of-needs", "photosynthesis"],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
