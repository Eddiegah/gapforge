import { Resend } from "resend";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
    to: email,
    subject: "Welcome to GapForge — here's how to get the most out of it",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
      <h1 style="color:#a78bfa;font-size:24px;">Welcome to GapForge, ${name ?? "researcher"}.</h1>
      <p style="color:#8b8bb3;line-height:1.6;">You just joined a platform built to help researchers find the gaps nobody is exploring yet.</p>
      <h2 style="color:#f0eeff;font-size:18px;margin-top:32px;">Start here:</h2>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">1. Run your first Gap AI search</p>
        <p style="color:#8b8bb3;font-size:14px;">Enter any research topic. GapForge scans Semantic Scholar, arXiv, PubMed, OpenAlex and more.</p>
      </div>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">2. Set up your research profile</p>
        <p style="color:#8b8bb3;font-size:14px;">Get a personalized Gap Drop every Friday scoped to your exact niche.</p>
      </div>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">3. Draft a research proposal</p>
        <p style="color:#8b8bb3;font-size:14px;">Found a gap? One click generates a full proposal with methodology, timeline, and references.</p>
      </div>
      <a href="${BASE_URL}/gap-ai" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Run your first search</a>
      <p style="color:#6b6b8a;font-size:12px;margin-top:32px;">GapForge — Research Intelligence Platform</p>
    </div>`,
  });
}

export async function sendDropIntroEmail(email: string, name: string): Promise<void> {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
    to: email,
    subject: "Your Gap Drops start this Friday",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
      <h1 style="color:#a78bfa;font-size:22px;">Your weekly drops are almost ready, ${name ?? "researcher"}.</h1>
      <p style="color:#8b8bb3;line-height:1.6;margin-top:12px;">Every Friday at 9am UTC, GapForge generates a personalized research digest — gaps, startup opportunities, funding, and cross-disciplinary angles scoped to your niche.</p>
      <a href="${BASE_URL}/onboarding" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Set up your profile</a>
      <p style="color:#6b6b8a;font-size:12px;margin-top:32px;">GapForge — Research Intelligence Platform</p>
    </div>`,
  });
}

export async function sendUpgradeNudgeEmail(email: string, name: string, creditsUsed: number): Promise<void> {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
    to: email,
    subject: `You've run ${creditsUsed} searches — ready to go unlimited?`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
      <h1 style="color:#a78bfa;font-size:22px;">${creditsUsed} searches in. Nice work, ${name ?? "researcher"}.</h1>
      <p style="color:#8b8bb3;line-height:1.6;margin-top:12px;">Pro removes the monthly limit entirely, plus unlocks the literature review compiler, citation export, and priority processing.</p>
      <div style="background:#13132e;border:2px solid #7c3aed;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="font-weight:700;color:#a78bfa;font-size:18px;">Pro — GHS 236/month</p>
        <ul style="color:#8b8bb3;line-height:2;margin:8px 0;padding-left:20px;">
          <li>Unlimited Gap AI searches</li>
          <li>Literature review compiler</li>
          <li>Citation export (APA, MLA, BibTeX)</li>
          <li>Research proposal draft</li>
        </ul>
      </div>
      <a href="${BASE_URL}/pricing" style="display:inline-block;padding:14px 28px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Upgrade to Pro</a>
      <p style="color:#6b6b8a;font-size:12px;margin-top:32px;">GapForge — Research Intelligence Platform</p>
    </div>`,
  });
}

export async function sendDay3Email(email: string, name: string): Promise<void> {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
    to: email,
    subject: "3 GapForge features you probably haven't tried yet",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
      <h1 style="color:#a78bfa;font-size:22px;">Hey ${name ?? "researcher"}, it's been 3 days.</h1>
      <p style="color:#8b8bb3;line-height:1.6;margin-top:8px;">Here are 3 powerful GapForge features most researchers discover too late:</p>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">1. Gap Radar — Visual field map</p>
        <p style="color:#8b8bb3;font-size:14px;">See your entire research field as an interactive bubble map. Spot dense clusters and sparse areas (= gaps) instantly.</p>
        <a href="${BASE_URL}/gap-radar" style="color:#a78bfa;font-size:13px;">Open Gap Radar →</a>
      </div>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">2. Grant Writer</p>
        <p style="color:#8b8bb3;font-size:14px;">Generate a complete NIH R01, NSF, or EU Horizon grant proposal from any research gap. Section by section, export as Markdown.</p>
        <a href="${BASE_URL}/grant-writer" style="color:#a78bfa;font-size:13px;">Try Grant Writer →</a>
      </div>
      <div style="background:#13132e;border:1px solid #1e1e4a;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="font-weight:600;color:#a78bfa;">3. Gap to Startup</p>
        <p style="color:#8b8bb3;font-size:14px;">Turn any research gap into a full startup idea — business model, MVP features, competitors, funding sources, and 90-day plan.</p>
        <a href="${BASE_URL}/gap-startup" style="color:#a78bfa;font-size:13px;">Generate startup idea →</a>
      </div>
      <p style="color:#6b6b8a;font-size:12px;margin-top:32px;">GapForge — Research Intelligence Platform · <a href="${BASE_URL}/settings" style="color:#6b6b8a;">Unsubscribe</a></p>
    </div>`,
  });
}

export async function sendDay7Email(email: string, name: string, searchCount: number): Promise<void> {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@gapforge.app",
    to: email,
    subject: `${name?.split(" ")[0] ?? "Researcher"}, your first week on GapForge`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0a0a1a;color:#f0eeff;border-radius:12px;">
      <h1 style="color:#a78bfa;font-size:22px;">One week in, ${name?.split(" ")[0] ?? "researcher"}.</h1>
      <p style="color:#8b8bb3;line-height:1.6;margin-top:8px;">You've run <strong style="color:#a78bfa;">${searchCount} Gap AI searches</strong> in your first week. Here's what's possible with more.</p>
      <div style="background:#13132e;border:2px solid #7c3aed;border-radius:8px;padding:24px;margin:20px 0;">
        <p style="font-weight:700;color:#a78bfa;font-size:16px;">Upgrade to Pro</p>
        <p style="color:#8b8bb3;font-size:14px;margin:8px 0;">Unlimited searches + Grant Writer + Peer Review AI + all premium tools.</p>
        <p style="color:#a78bfa;font-size:22px;font-weight:700;">$20/month</p>
        <a href="${BASE_URL}/pricing" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Upgrade now</a>
      </div>
      <p style="color:#8b8bb3;font-size:13px;line-height:1.6;">Not ready? The free plan still gives you 10 Gap AI searches/month, access to all 60+ tools, and a personalized Gap Drop every Friday.</p>
      <p style="color:#6b6b8a;font-size:12px;margin-top:24px;">GapForge — Research Intelligence Platform · <a href="${BASE_URL}/settings" style="color:#6b6b8a;">Unsubscribe</a></p>
    </div>`,
  });
}

