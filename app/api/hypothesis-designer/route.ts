import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gap, field, approach } = await req.json();
  if (!gap?.trim()) return NextResponse.json({ error: "Gap required" }, { status: 400 });

  const prompt = `Design a complete ${approach ?? "experimental"} study to test this research hypothesis:

GAP/IDEA: ${gap}
FIELD: ${field || "General research"}

Return JSON only:
{
  "hypothesis": "Specific H1 statement",
  "nullHypothesis": "H0 statement",
  "independentVariable": "What is manipulated/measured",
  "dependentVariable": "What is measured as outcome",
  "controlVariables": ["Variable 1", "Variable 2", "Variable 3"],
  "studyDesign": "Specific study design description",
  "participants": "Who participates and inclusion/exclusion criteria",
  "sampleSize": "Recommended n with brief justification",
  "powerCalculation": "Power analysis recommendation",
  "dataCollection": ["Method 1", "Method 2", "Method 3"],
  "statisticalTests": ["Test 1", "Test 2"],
  "timeline": [
    { "phase": "Phase 1 name", "duration": "3 months", "activities": "What happens" },
    { "phase": "Phase 2 name", "duration": "6 months", "activities": "What happens" }
  ],
  "ethicsConsiderations": ["Consideration 1", "Consideration 2"],
  "limitations": ["Limitation 1", "Limitation 2", "Limitation 3"],
  "expectedOutcome": "What you expect to find and its significance"
}`;

  const { text } = await llmCall(
    "You are an expert research methodologist who designs rigorous, feasible studies.",
    prompt, 1400
  );

  const design = extractJson(text);
  if (!design) return NextResponse.json({ error: "Failed to generate design. Please try again." }, { status: 500 });

  return NextResponse.json({ design });
}
