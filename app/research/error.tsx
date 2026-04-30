"use client";

export default function ResearchError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="page">
      <div className="empty-state">
        <h2>Dashboard error</h2>
        <p>{error.message}</p>
        <div className="empty-state__action">
          <button onClick={() => reset()} type="button">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
