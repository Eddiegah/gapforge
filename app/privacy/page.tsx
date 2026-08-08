import { PublicNav } from "@/components/nav";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect: your name, email address, and profile picture when you sign in via Google or GitHub; your research profile (areas, keywords, career stage) when you complete onboarding; your search queries and gap results; usage data such as search counts and credits used."
    },
    {
      title: "2. How We Use Your Information",
      content: "We use your information to: provide and personalize the GapForge service; generate your weekly Gap Drops based on your research profile; send transactional emails (welcome, drop notifications, alerts); improve gap detection accuracy; and communicate platform updates."
    },
    {
      title: "3. Data Storage",
      content: "Your data is stored in a Neon Postgres database hosted on AWS. Session data is cached in Upstash Redis. We retain your data for as long as your account is active. You may request deletion at any time by contacting us."
    },
    {
      title: "4. Third-Party Services",
      content: "GapForge uses the following third-party services: Google OAuth and GitHub OAuth for authentication; Neon for database storage; Upstash Redis for rate limiting and caching; Resend for transactional email; Google Gemini and Groq for AI-powered gap analysis; Semantic Scholar, arXiv, PubMed, OpenAlex, Crossref, bioRxiv, and DOAJ for academic paper retrieval; Vercel for hosting."
    },
    {
      title: "5. Data Sharing",
      content: "We do not sell your personal data. We share data only with the third-party services listed above, as necessary to provide the service. Search queries are sent to AI providers (Gemini/Groq) for gap analysis — do not include sensitive personal information in search queries."
    },
    {
      title: "6. Cookies",
      content: "We use session cookies for authentication and preference cookies for theme settings. We do not use advertising or tracking cookies."
    },
    {
      title: "7. Your Rights",
      content: "You have the right to: access your personal data; correct inaccurate data; request deletion of your account and data; withdraw consent at any time. To exercise these rights, contact gahedmund146@gmail.com."
    },
    {
      title: "8. Security",
      content: "We use industry-standard security measures including HTTPS encryption, hashed API keys, and access controls. No system is completely secure — please use a strong password and sign out on shared devices."
    },
    {
      title: "9. Contact",
      content: "For privacy questions or data requests, contact us at gahedmund146@gmail.com."
    },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Privacy Policy</h1>
          <p className="text-sm text-[rgb(var(--muted))] mt-2">Effective date: August 5, 2026</p>
        </div>
        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title} className="card p-6">
              <h2 className="font-semibold text-[rgb(var(--fg))] mb-2">{s.title}</h2>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
