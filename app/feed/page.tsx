"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users2, Loader, UserPlus, UserMinus, ExternalLink } from "lucide-react";
import { AppNav } from "@/components/nav";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import { useToast } from "@/components/toast";

interface FeedItem { id: string; gap_json: DetectedGap; created_at: string; author_name: string; author_image: string | null; author_id: string; }
interface Researcher { id: string; name: string; image: string | null; research_areas?: string[]; }

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [following, setFollowing] = useState<Researcher[]>([]);
  const [suggested, setSuggested] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/follow?type=feed").then(r => r.json()),
      fetch("/api/follow?type=following").then(r => r.json()),
      fetch("/api/researchers").then(r => r.json()),
    ]).then(([feedData, followData, resData]) => {
      setFeed(feedData.feed ?? []);
      setFollowing(followData.following ?? []);
      setSuggested((resData.researchers ?? []).filter((r: Researcher) => !(followData.following ?? []).find((f: Researcher) => f.id === r.id)).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const follow = async (userId: string, action: "follow" | "unfollow") => {
    await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: userId, action }) });
    if (action === "follow") {
      const r = suggested.find(s => s.id === userId);
      if (r) { setFollowing(p => [...p, r]); setSuggested(p => p.filter(s => s.id !== userId)); }
      toast("Following!");
    } else {
      setFollowing(p => p.filter(f => f.id !== userId));
      toast("Unfollowed");
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><Users2 size={18} className="text-violet-400" /></div>
            <div><h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Research Feed</h1><p className="text-sm text-[rgb(var(--muted))]">Gaps from researchers you follow.</p></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {loading ? <div className="flex justify-center py-16"><Loader size={24} className="text-violet-400 animate-spin" /></div>
                : feed.length === 0 ? (
                  <div className="card p-12 text-center border-dashed">
                    <Users2 size={32} className="text-violet-400/40 mx-auto mb-4" />
                    <p className="font-semibold text-[rgb(var(--fg))] mb-2">Follow researchers to see their gaps</p>
                    <p className="text-sm text-[rgb(var(--muted))]">When researchers you follow save gaps, they appear here.</p>
                  </div>
                ) : feed.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {item.author_image ? <img src={item.author_image} alt={item.author_name} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">{item.author_name?.[0]}</div>}
                      <div><p className="text-sm font-medium text-[rgb(var(--fg))]">{item.author_name}</p><p className="text-xs text-[rgb(var(--muted))]">{formatRelativeDate(item.created_at)}</p></div>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide mb-1">{item.gap_json.category.replace(/-/g, " ")}</p>
                    <h3 className="font-semibold text-[rgb(var(--fg))] mb-1">{item.gap_json.title}</h3>
                    <p className="text-sm text-[rgb(var(--muted))] line-clamp-2">{item.gap_json.description}</p>
                    <a href={`/gap/${item.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"><ExternalLink size={11} /> View gap</a>
                  </motion.div>
                ))}
            </div>

            <div className="space-y-4">
              {following.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">Following</h3>
                  <div className="space-y-3">
                    {following.map(r => (
                      <div key={r.id} className="flex items-center gap-3">
                        {r.image ? <img src={r.image} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{r.name?.[0]}</div>}
                        <p className="text-sm text-[rgb(var(--fg))] flex-1 truncate">{r.name}</p>
                        <button onClick={() => follow(r.id, "unfollow")} className="text-[rgb(var(--muted))] hover:text-red-400 transition-colors"><UserMinus size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {suggested.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">Suggested researchers</h3>
                  <div className="space-y-3">
                    {suggested.map(r => (
                      <div key={r.id} className="flex items-center gap-3">
                        {r.image ? <img src={r.image} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{r.name?.[0]}</div>}
                        <div className="flex-1 min-w-0"><p className="text-sm text-[rgb(var(--fg))] truncate">{r.name}</p>{(r.research_areas ?? []).length > 0 && <p className="text-xs text-[rgb(var(--muted))] truncate">{(r.research_areas ?? []).slice(0,2).join(", ")}</p>}</div>
                        <button onClick={() => follow(r.id, "follow")} className="text-violet-400 hover:text-violet-300 transition-colors"><UserPlus size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
