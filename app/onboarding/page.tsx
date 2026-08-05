"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Loader } from "lucide-react";
import { Nav } from "@/components/nav";
import { cn } from "@/lib/utils";

const RESEARCH_AREAS = [
  "Biology", "Chemistry", "Physics", "Computer Science", "Mathematics",
  "Medicine", "Psychology", "Economics", "Sociology", "History",
  "Environmental Science", "Engineering", "Neuroscience", "Materials Science",
  "Political Science", "Philosophy", "Linguistics", "Education",
];

const METHODOLOGIES = [
  "Experimental", "Observational", "Computational", "Theoretical",
  "Mixed methods", "Qualitative", "Meta-analysis", "Systematic review",
  "Machine learning", "Statistical modeling", "Field work", "Clinical trials",
];

const CAREER_STAGES = [
  { value: "undergrad", label: "Undergraduate" },
  { value: "phd", label: "PhD student" },
  { value: "postdoc", label: "Postdoc" },
  { value: "faculty", label: "Faculty / Researcher" },
  { value: "industry", label: "Industry researcher" },
  { value: "independent", label: "Independent researcher" },
];

const GOALS = [
  { value: "gap-finding", label: "Identify research gaps" },
  { value: "staying-current", label: "Stay current in my field" },
  { value: "literature-review", label: "Build literature reviews" },
  { value: "collaboration", label: "Find collaboration opportunities" },
];

function MultiSelect({
  options,
  selected,
  onToggle,
  max,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        const disabled = !isSelected && max !== undefined && selected.length >= max;
        return (
          <button
            key={opt}
            onClick={() => !disabled && onToggle(opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-all",
              isSelected
                ? "bg-coral text-white border-coral"
                : disabled
                ? "opacity-40 cursor-not-allowed border-[rgb(var(--border))] text-[rgb(var(--muted))]"
                : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-coral/50 hover:text-[rgb(var(--foreground))]"
            )}
          >
            {isSelected && <Check size={11} className="inline mr-1" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const STEPS = [
  "Research areas",
  "Methodologies",
  "Career stage",
  "Keywords",
  "Goals",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [researchAreas, setResearchAreas] = useState<string[]>([]);
  const [methodologies, setMethodologies] = useState<string[]>([]);
  const [careerStage, setCareerStage] = useState<string>("");
  const [keywords, setKeywords] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const toggle = (arr: string[], val: string, setArr: (a: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const canAdvance = () => {
    if (step === 0) return researchAreas.length > 0;
    if (step === 1) return methodologies.length > 0;
    if (step === 2) return careerStage !== "";
    if (step === 3) return keywords.trim().length > 0;
    if (step === 4) return goals.length > 0;
    return false;
  };

  const handleFinish = async () => {
    setSaving(true);
    const kw = keywords.split(",").map((k) => k.trim()).filter(Boolean);

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researchAreas,
          methodologies,
          careerStage,
          disciplines: researchAreas,
          keywords: kw,
          goals,
        }),
      });
      router.push("/gap-drops");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[rgb(var(--muted))] mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={i === step ? "text-coral font-medium" : ""}>{s}</span>
            ))}
          </div>
          <div className="h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-coral rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="card p-8"
          >
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">What do you research?</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6">Select all that apply. This shapes the sources and gaps we prioritize for you.</p>
                <MultiSelect
                  options={RESEARCH_AREAS}
                  selected={researchAreas}
                  onToggle={(v) => toggle(researchAreas, v, setResearchAreas)}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">Which methodologies do you use?</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6">Helps us surface gaps relevant to your approach.</p>
                <MultiSelect
                  options={METHODOLOGIES}
                  selected={methodologies}
                  onToggle={(v) => toggle(methodologies, v, setMethodologies)}
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">Where are you in your career?</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6">We tailor drop content to your context.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {CAREER_STAGES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCareerStage(value)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium text-left transition-all",
                        careerStage === value
                          ? "bg-coral/10 border-coral text-coral"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-coral/50 hover:text-[rgb(var(--foreground))]"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">What specific topics do you care about?</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6">Enter comma-separated keywords. Be specific — this is the core of your niche.</p>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. CRISPR, gene therapy, off-target effects, stem cells..."
                  rows={4}
                  className="input resize-none"
                  aria-label="Research keywords"
                />
                <p className="text-xs text-[rgb(var(--muted))] mt-2">
                  {keywords.split(",").filter((k) => k.trim()).length} keyword(s) entered
                </p>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">What are you trying to accomplish?</h2>
                <p className="text-sm text-[rgb(var(--muted))] mb-6">Shapes how your weekly drops are structured.</p>
                <div className="space-y-2">
                  {GOALS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggle(goals, value, setGoals)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-sm font-medium text-left flex items-center gap-3 transition-all",
                        goals.includes(value)
                          ? "bg-coral/10 border-coral text-coral"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-coral/50 hover:text-[rgb(var(--foreground))]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        goals.includes(value) ? "border-coral" : "border-[rgb(var(--border))]"
                      )}>
                        {goals.includes(value) && <div className="w-2 h-2 rounded-full bg-coral" />}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-0"
          >
            <ChevronLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="btn-primary flex items-center gap-2"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canAdvance() || saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={14} /> Save profile
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
