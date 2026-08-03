// MedStage — Brand header (top-left logo + connection pill)

export function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand">
        <div className="brand-mark">
          {/* Medical cross icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v16M4 12h16" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">
            Med<span className="accent">Stage</span>
          </div>
          <div className="brand-subtitle">University of Utah · Medical Center</div>
        </div>
      </div>
      <div className="header-meta">
        <div className="connection-pill">
          <div className="connection-dot" />
          <span>Live prototype</span>
        </div>
      </div>
    </header>
  );
}
