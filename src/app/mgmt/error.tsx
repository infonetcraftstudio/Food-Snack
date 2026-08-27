'use client';

export default function ManagementError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="access-page"><div className="access-card"><p className="eyebrow">Management workspace</p><h1>Workspace unavailable</h1><p className="muted">The page could not connect to the production database. Configure DATABASE_URL in the Vercel project environment, then redeploy.</p><button className="primary-button" onClick={() => reset()}>Try again</button></div></main>;
}
