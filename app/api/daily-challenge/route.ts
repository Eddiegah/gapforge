import { NextResponse } from "next/server";

// Seeded by day so same challenge all day
const TOPICS = [
  "gut microbiome and mental health", "CRISPR cancer therapy", "climate change food security",
  "AI ethics in healthcare", "antibiotic resistance mechanisms", "neuroplasticity in adults",
  "mRNA technology applications", "quantum computing algorithms", "sleep and cognitive performance",
  "plastic pollution marine ecosystems", "gene editing ethical limits", "COVID long-term effects",
  "stem cell regenerative medicine", "machine learning drug discovery", "microbiome autism connection",
  "renewable energy storage", "Alzheimer prevention strategies", "vaccine hesitancy psychology",
  "space medicine human adaptation", "urban heat island solutions", "PTSD treatment innovations",
  "sustainable agriculture methods", "brain-computer interface ethics", "aging reversal biology",
  "dark matter detection methods", "coral reef restoration", "digital mental health interventions",
  "hydrogen fuel cell technology", "ocean acidification marine life", "precision medicine genetics",
];

export async function GET() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const topic = TOPICS[dayOfYear % TOPICS.length];
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return NextResponse.json({ topic, date, challengeNumber: dayOfYear });
}
