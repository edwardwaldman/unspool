import type { ReelScript } from "./schema";
import type { SpoolDTO } from "./spool-types";

// A hard-coded sample spool (AP Statistics: sampling & study design) used for the landing-page
// background, the /s/demo feed, and developing the viewer without any backend.

const reel1: ReelScript = {
  index: 1,
  title: "POPULATION vs SAMPLE",
  headline: "A chef never eats the whole pot. So how does she know the *soup* is salty?",
  summary: "Population vs sample: why statistics studies a small part to learn about the whole.",
  stats: [
    { label: "population", value: 2000, prefix: "", suffix: "", at_beat: 2 },
    { label: "sample", value: 50, prefix: "", suffix: "", at_beat: 3 },
  ],
  beats: [
    {
      say: "A chef never eats the #whole pot# to know if the soup is salty.",
      visual: { type: "hook", icon: "soup", tag: "GUARANTEED QUESTION", color: "primary" },
    },
    {
      say: "She tastes *one spoonful.* That's statistics in one sentence.",
      visual: { type: "icons", items: [{ icon: "soup", label: "THE POT" }, { icon: "utensils", label: "ONE SPOONFUL" }], arrow: true },
    },
    {
      say: "The whole pot is the *population.* Everyone or everything you want to know about.",
      visual: { type: "bigword", word: "POPULATION", sub: "the entire group you care about", color: "primary" },
    },
    {
      say: "The spoonful is the *sample.* The part you actually measure.",
      visual: { type: "crowd", total_label: "POPULATION", highlight_label: "SAMPLE", ratio: 0.05 },
    },
    {
      say: "Say a school has two thousand students. You survey fifty. The fifty are your ~sample.~",
      visual: { type: "split", mode: "vs", left: { icon: "school", title: "2,000", sub: "every student" }, right: { icon: "clipboard", title: "50", sub: "the ones you asked" } },
    },
    {
      say: "Here's the #trap:# the sample only works if it's mixed well. Stir the pot first.",
      visual: { type: "flow", steps: [{ icon: "utensils", title: "STIR", sub: "randomize" }, { icon: "search", title: "TASTE", sub: "measure the sample" }, { icon: "check", title: "CONCLUDE", sub: "about the population" }] },
    },
    {
      say: "Memory hack: *P*opulation is the *P*ot. *S*ample is the *S*poon.",
      visual: { type: "bigword", word: "POT · SPOON", sub: "population · sample", color: "yellow" },
    },
  ],
  quiz: {
    question: "You poll 400 voters to learn about ALL voters in a state. The 400 are the…",
    options: ["Population", "Sample", "Parameter"],
    answer: 1,
    explain: "*Sample.* They're the spoonful; all voters are the pot.",
  },
  outro: { next_title: "PARAMETER vs STATISTIC", say: "Next: parameter versus statistic. Keep scrolling." },
};

const reel2: ReelScript = {
  index: 2,
  title: "PARAMETER vs STATISTIC",
  headline: "Mix these two words up and you #lose points#. Here's how to never confuse *parameter* and *statistic*.",
  summary: "A parameter describes a population; a statistic describes a sample.",
  stats: [
    { label: "true mean", value: 7.2, prefix: "", suffix: " hrs", at_beat: 2 },
    { label: "sample mean", value: 6.8, prefix: "", suffix: " hrs", at_beat: 3 },
  ],
  beats: [
    {
      say: "Mix these two up and you #lose points.# Every single test.",
      visual: { type: "hook", icon: "alert", tag: "COMMON TRAP", color: "warn" },
    },
    {
      say: "A *parameter* is a number that describes the whole *population.*",
      visual: { type: "bigword", word: "PARAMETER", sub: "describes the population", color: "primary" },
    },
    {
      say: "Like the true average sleep of every teen in the country. Usually unknown.",
      visual: { type: "stat", value: "7.2 HRS", label: "TRUE AVERAGE (UNKNOWN)", color: "primary" },
    },
    {
      say: "A ~statistic~ describes a ~sample.~ The average from the teens you actually asked.",
      visual: { type: "stat", value: "6.8 HRS", label: "SAMPLE AVERAGE", color: "cyan" },
    },
    {
      say: "We use the statistic to *estimate* the parameter.",
      visual: { type: "split", mode: "to", left: { icon: "clipboard", title: "STATISTIC", sub: "what you measured" }, right: { icon: "globe", title: "PARAMETER", sub: "what you want" } },
    },
    {
      say: "Memory hack: *P*arameter goes with *P*opulation. *S*tatistic goes with *S*ample.",
      visual: { type: "list", title: "MATCH THE LETTERS", items: [{ icon: "users", label: "Parameter → Population" }, { icon: "user", label: "Statistic → Sample" }] },
    },
  ],
  quiz: {
    question: "The true proportion of ALL voters who support a law is a…",
    options: ["Statistic", "Parameter", "Sample"],
    answer: 1,
    explain: "*Parameter.* It describes the whole population.",
  },
  outro: { next_title: "4 SAMPLING METHODS", say: "Next: four sampling methods. Keep scrolling." },
};

const reel3: ReelScript = {
  index: 3,
  title: "4 SAMPLING METHODS",
  headline: "There are four ways to pick a sample, and only one is *simple random*. Know them all.",
  summary: "Simple random, stratified, cluster and systematic sampling, and how to tell them apart.",
  stats: [{ label: "methods", value: 4, prefix: "", suffix: "", at_beat: 1 }],
  beats: [
    {
      say: "Four ways to pick a sample. The test #will# ask you to name one.",
      visual: { type: "hook", icon: "target", tag: "GUARANTEED QUESTION", color: "primary" },
    },
    {
      say: "Here they are.",
      visual: { type: "list", title: "SAMPLING METHODS", items: [{ icon: "dice", label: "Simple random (S R S)" }, { icon: "layers", label: "Stratified" }, { icon: "house", label: "Cluster" }, { icon: "ruler", label: "Systematic" }] },
    },
    {
      say: "*Simple random:* every group of that size has an equal chance. Names in a hat.",
      visual: { type: "icons", items: [{ icon: "shuffle", label: "ALL NAMES" }, { icon: "dice", label: "RANDOM DRAW" }], arrow: true },
    },
    {
      say: "*Stratified:* split into similar groups first, like grades, then sample from #every# group.",
      visual: { type: "flow", steps: [{ icon: "layers", title: "SPLIT", sub: "into similar strata" }, { icon: "dice", title: "SAMPLE", sub: "from each stratum" }] },
    },
    {
      say: "*Cluster:* split into groups, then pick a few #whole# groups. Like three entire homerooms.",
      visual: { type: "crowd", total_label: "ALL HOMEROOMS", highlight_label: "PICKED CLUSTERS", ratio: 0.2 },
    },
    {
      say: "*Systematic:* pick a random start, then every ^tenth^ person.",
      visual: { type: "bigword", word: "EVERY 10TH", sub: "after a random start", color: "yellow" },
    },
    {
      say: "Trap: stratified samples from #all# groups. Cluster takes #some# whole groups.",
      visual: { type: "split", mode: "vs", left: { icon: "layers", title: "STRATIFIED", sub: "some from every group" }, right: { icon: "house", title: "CLUSTER", sub: "all from some groups" } },
    },
  ],
  quiz: {
    question: "A school randomly picks 3 homerooms and surveys every student in them. That's…",
    options: ["Stratified", "Cluster", "Systematic"],
    answer: 1,
    explain: "*Cluster.* Whole groups were picked, not some from each group.",
  },
  outro: { next_title: "BIAS IN SAMPLING", say: "Next: the biases that ruin a sample. Keep scrolling." },
};

const lockedTitles: [string, string][] = [
  ["BIAS IN SAMPLING", "The 1936 poll that predicted the wrong president, by two million ballots."],
  ["VOLUNTARY RESPONSE", "Why online polls are basically useless, and how to say it on the test."],
  ["OBSERVATIONAL vs EXPERIMENT", "Only one of these can ever prove cause and effect."],
  ["CONTROL GROUPS", "No control group? Then you can't trust the result. Here's why."],
  ["BLINDING & PLACEBOS", "Sugar pills cure people. That's exactly the problem."],
  ["CONFOUNDING", "Ice cream doesn't cause shark attacks. Something else does both."],
  ["FREE RESPONSE TIPS", "The exact words graders look for on sampling questions."],
];

export const SAMPLE_SPOOL: SpoolDTO = {
  id: "demo",
  fileName: "AP Stats — Unit 3 notes.pdf",
  fileType: "pdf",
  title: "AP Stats: Sampling & Studies",
  docType: "study",
  sensitive: false,
  status: "scripting",
  error: null,
  unlocked: false,
  freeReels: 3,
  nextFreeUnlockAt: null,
  pageCount: 18,
  wordCount: 6400,
  truncated: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  demo: true,
  reels: [
    ...[reel1, reel2, reel3].map((script) => ({
      id: `demo-${script.index}`,
      index: script.index,
      title: script.title,
      hook: script.beats[0].say.replace(/[*#^~]/g, ""),
      status: "ready" as const,
      locked: false,
      script,
    })),
    ...lockedTitles.map(([title, hook], i) => ({
      id: `demo-${i + 4}`,
      index: i + 4,
      title,
      hook,
      status: "pending" as const,
      locked: true,
    })),
  ],
};
