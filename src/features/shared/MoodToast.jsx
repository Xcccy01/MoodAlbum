import { BURST_ARTS, getMoodArtName, IllustrationIcon } from "./IllustrationIcon.jsx";

export function MoodToast({ mood }) {
  return (
    <div className="toast-overlay">
      <div className="toast-card">
        <span className="burst">
          <IllustrationIcon name={BURST_ARTS[0]} className="burst-illustration" />
        </span>
        <span className="burst">
          <IllustrationIcon name={BURST_ARTS[1]} className="burst-illustration" />
        </span>
        <span className="burst">
          <IllustrationIcon name={BURST_ARTS[2]} className="burst-illustration" />
        </span>
        <span className="burst">
          <IllustrationIcon name={BURST_ARTS[3]} className="burst-illustration" />
        </span>
        <div className="toast-emoji">
          <IllustrationIcon
            name={getMoodArtName(mood.key, mood.label, mood.icon)}
            className="toast-illustration"
          />
        </div>
        <div className="meta-title" style={{ fontSize: 24 }}>
          已记录 ✓
        </div>
        <div className="meta-subtitle" style={{ marginTop: 6 }}>
          {mood.label}
        </div>
      </div>
    </div>
  );
}
