"use client";

import { useState } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  DollarSign, Search, ExternalLink, Bell, BellOff,
  Calendar, Globe, Filter, ChevronDown, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Grant {
  id: string;
  funder: string;
  name: string;
  amount: string;
  deadline: string;
  fields: string[];
  description: string;
  website: string;
  type: "research" | "startup" | "travel" | "postdoc";
  region: string;
}

const GRANTS: Grant[] = [
  { id: "nih-r01", funder: "NIH", name: "R01 Research Project Grant", amount: "$250K-$500K/yr", deadline: "February, June, October", fields: ["Biomedical", "Clinical", "Behavioral"], description: "The flagship NIH grant for hypothesis-driven research. Supports 3-5 years of substantial research.", website: "https://grants.nih.gov/grants/funding/r01.htm", type: "research", region: "Global" },
  { id: "nih-r21", funder: "NIH", name: "R21 Exploratory Research", amount: "Up to $275K (2yr)", deadline: "February, June, October", fields: ["Biomedical", "Clinical"], description: "For exploratory and developmental research — testing novel ideas, new approaches, or preliminary data.", website: "https://grants.nih.gov", type: "research", region: "Global" },
  { id: "nsf-career", funder: "NSF", name: "CAREER Award", amount: "$400K-$500K (5yr)", deadline: "July–October", fields: ["CS", "Engineering", "Math", "Social Science"], description: "NSF's most prestigious award for early-career faculty. Integrates research and education.", website: "https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=503214", type: "research", region: "USA" },
  { id: "nsf-sbir", funder: "NSF", name: "SBIR/STTR Program", amount: "$256K (Phase I) / $1.7M (Phase II)", deadline: "March, June, September", fields: ["Technology", "AI", "Biotech"], description: "Funding for startups and small businesses to commercialize research with societal impact.", website: "https://seedfund.nsf.gov", type: "startup", region: "USA" },
  { id: "erc-starting", funder: "European Research Council", name: "ERC Starting Grant", amount: "Up to €1.5M (5yr)", deadline: "October", fields: ["All fields"], description: "For early-career researchers with 2-7 years post-PhD. Supports high-risk, high-reward research.", website: "https://erc.europa.eu/apply-grant/starting-grant", type: "research", region: "Europe" },
  { id: "wellcome-discovery", funder: "Wellcome Trust", name: "Discovery Research", amount: "Up to £3M (5yr)", deadline: "Open (2 stages)", fields: ["Biomedical", "Public Health", "Mental Health"], description: "Supports exceptional researchers pursuing the most creative, highest quality science.", website: "https://wellcome.org/grant-funding/schemes/discovery-research", type: "research", region: "Global" },
  { id: "gates-grand", funder: "Bill & Melinda Gates Foundation", name: "Grand Challenges Explorations", amount: "$100K initial", deadline: "Quarterly", fields: ["Global Health", "Agriculture", "Education"], description: "Seed funding for bold ideas in global health and development. No preliminary data required.", website: "https://gcgh.grandchallenges.org", type: "research", region: "Global" },
  { id: "gates-global", funder: "Bill & Melinda Gates Foundation", name: "Global Health Discovery", amount: "Varies ($500K-$5M)", deadline: "By invitation / Rolling", fields: ["Global Health", "Vaccines", "Nutrition"], description: "Supports transformative research to reduce inequity in global health.", website: "https://www.gatesfoundation.org/about/how-we-work/grant-opportunities", type: "research", region: "Global" },
  { id: "darpa-yfa", funder: "DARPA", name: "Young Faculty Award", amount: "$500K-$1M (2yr)", deadline: "February", fields: ["CS", "Engineering", "AI", "Physics"], description: "Identifies and engages rising research stars at US universities who could become future DARPA program managers.", website: "https://www.darpa.mil/work-with-us/young-faculty-award", type: "research", region: "USA" },
  { id: "simons", funder: "Simons Foundation", name: "Investigator Programs", amount: "$100K-$660K/yr", deadline: "By invitation", fields: ["Math", "Physics", "CS", "Life Sciences"], description: "Supports outstanding theoretical scientists and mathematicians engaged in high-quality research.", website: "https://www.simonsfoundation.org/funding-opportunities", type: "research", region: "Global" },
  { id: "czinitiative", funder: "Chan Zuckerberg Initiative", name: "Science Grants", amount: "$100K-$3M", deadline: "Rolling / Annual", fields: ["Biomedical", "Neuroscience", "Education"], description: "Funds basic science that could lead to cures for all diseases in children's lifetimes.", website: "https://chanzuckerberg.com/science/programs-resources", type: "research", region: "Global" },
  { id: "fogarty", funder: "Fogarty International (NIH)", name: "International Research Training", amount: "$100K-$500K", deadline: "March, July, November", fields: ["Global Health", "Infectious Disease", "Mental Health"], description: "Supports research training in low and middle-income countries through partnerships.", website: "https://www.fic.nih.gov/Funding/Pages/default.aspx", type: "research", region: "LMIC" },
  { id: "usaid-div", funder: "USAID", name: "Development Innovation Ventures", amount: "$25K-$2M", deadline: "Rolling", fields: ["Development", "Technology", "Health", "Agriculture"], description: "Tiered funding for breakthrough innovations to solve global development challenges.", website: "https://www.usaid.gov/div", type: "startup", region: "Global" },
  { id: "macarthur", funder: "MacArthur Foundation", name: "Research Grants", amount: "$300K-$1M", deadline: "By invitation", fields: ["Criminal Justice", "Climate", "Nuclear Security"], description: "Supports creative research on pressing social, environmental, and policy challenges.", website: "https://www.macfound.org/info-grantseekers", type: "research", region: "Global" },
  { id: "aas", funder: "African Academy of Sciences", name: "AESA Grants", amount: "$50K-$200K", deadline: "Varies", fields: ["Health", "Agriculture", "Environment", "STEM"], description: "Supports African-led research addressing Africa's development challenges. Priority for Africa-based researchers.", website: "https://www.aasciences.africa/grants", type: "research", region: "Africa" },
  { id: "carnegie", funder: "Carnegie Corporation of New York", name: "Education & Democracy Grants", amount: "$100K-$2M", deadline: "Rolling", fields: ["Education", "Democracy", "International Peace"], description: "Grants for programs advancing education and democratic governance globally.", website: "https://www.carnegie.org/grants/grants-database", type: "research", region: "Global" },
  { id: "ford", funder: "Ford Foundation", name: "Equality Grants", amount: "$100K-$1M", deadline: "By invitation", fields: ["Social Justice", "Economics", "Education", "Democracy"], description: "Supports organizations and scholars working to reduce inequality and strengthen democracy.", website: "https://www.fordfoundation.org/work/challenging-inequality/grants", type: "research", region: "Global" },
  { id: "openphil", funder: "Open Philanthropy", name: "Research Grants", amount: "$100K-$10M", deadline: "Rolling", fields: ["AI Safety", "Global Health", "Biosecurity", "Science"], description: "Supports research in areas with potential for large-scale positive impact, especially AI safety.", website: "https://www.openphilanthropy.org/how-to-apply-for-funding", type: "research", region: "Global" },
  { id: "schmidt", funder: "Schmidt Futures", name: "Science & Technology Grants", amount: "$100K-$5M", deadline: "Rolling / By invitation", fields: ["AI", "Biotech", "Climate", "Education"], description: "Supports exceptional scientists and innovators working on emerging technology challenges.", website: "https://www.schmidtfutures.com/our-work/grants-and-fellowships", type: "research", region: "Global" },
  { id: "rockefeller", funder: "Rockefeller Foundation", name: "Innovation Grants", amount: "$200K-$2M", deadline: "Rolling", fields: ["Food Systems", "Health", "Energy", "Economic Mobility"], description: "Promotes the well-being of humanity through grants in food, health, and economic development.", website: "https://www.rockefellerfoundation.org/grants", type: "research", region: "Global" },
];

const FIELD_OPTIONS = ["All", "Biomedical", "Clinical", "CS", "AI", "Global Health", "Environment", "Education", "Agriculture", "Social Science", "Africa"];
const TYPE_OPTIONS = ["all", "research", "startup", "postdoc"];

export default function GrantTrackerPage() {
  const [search, setSearch] = useState("");
  const [field, setField] = useState("All");
  const [type, setType] = useState("all");
  const [alerts, setAlerts] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const toggleAlert = async (grant: Grant) => {
    const isSet = alerts.has(grant.id);
    setAlerts(prev => {
      const next = new Set(prev);
      isSet ? next.delete(grant.id) : next.add(grant.id);
      return next;
    });
    if (!isSet) {
      try {
        await fetch("/api/gap-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gapTitle: `${grant.funder}: ${grant.name}`, gapQuery: `${grant.name} ${grant.funder} funding deadline` }),
        });
        showToast(`Alert set for ${grant.name}`);
      } catch { /* ignore */ }
    } else {
      showToast("Alert removed");
    }
  };

  const filtered = GRANTS.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.funder.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    const matchField = field === "All" || g.fields.some(f => f.toLowerCase().includes(field.toLowerCase()));
    const matchType = type === "all" || g.type === type;
    return matchSearch && matchField && matchType;
  });

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <DollarSign size={22} className="text-green-400" /> Grant Tracker
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              {GRANTS.length} funding opportunities — NIH, NSF, Gates, EU Horizon, African Academy of Sciences, and more.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search grants, funders, or keywords..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            </div>
            <select value={field} onChange={e => setField(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
              {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
              <option value="all">All types</option>
              <option value="research">Research</option>
              <option value="startup">Startup/Commercialization</option>
            </select>
          </div>

          <p className="text-xs text-[rgb(var(--muted))] mb-4">{filtered.length} grants found</p>

          <div className="space-y-3">
            {filtered.map((grant, i) => (
              <motion.div key={grant.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="card p-5 hover:border-violet-500/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">{grant.funder}</span>
                      {grant.region !== "Global" && (
                        <span className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] px-2 py-0.5 rounded-full">{grant.region}</span>
                      )}
                      <span className="text-xs font-bold text-violet-400">{grant.amount}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">{grant.name}</h3>
                    <p className="text-xs text-[rgb(var(--muted))] leading-relaxed mb-2">{grant.description}</p>
                    <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted))] flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {grant.deadline}</span>
                      <span className="flex items-center gap-1"><Globe size={11} /> {grant.fields.slice(0, 3).join(", ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleAlert(grant)}
                      className={cn("p-2 rounded-lg transition-colors", alerts.has(grant.id)
                        ? "text-violet-400 bg-violet-400/10"
                        : "text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10")}
                      title={alerts.has(grant.id) ? "Remove alert" : "Set alert"}>
                      {alerts.has(grant.id) ? <BellOff size={15} /> : <Bell size={15} />}
                    </button>
                    <a href={grant.website} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
