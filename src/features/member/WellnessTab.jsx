import { PLANT_STAGE_META, WELLNESS_TIPS } from "../../lib/constants.js";

function getProgressPercent(totalCount, nextStageAt) {
  if (!nextStageAt) {
    return 100;
  }
  return Math.max(8, Math.min(100, Math.round((totalCount / nextStageAt) * 100)));
}

export function WellnessTab({ progress, onCheckin, loading }) {
  const plantMeta = PLANT_STAGE_META[progress.plantStage] || PLANT_STAGE_META["种子"];
  const tip = WELLNESS_TIPS[progress.totalCount % WELLNESS_TIPS.length];

  return (
    <section className="stack-block">
      <div className="surface-card hero-card">
        <div className="header-row">
          <div>
            <div className="eyebrow">每日打卡，植物成长</div>
            <h2>
              {plantMeta.emoji} 当前阶段 · {progress.plantStage}
            </h2>
          </div>
          <span className="status-pill success">{progress.streakCount} 天连续</span>
        </div>

        <p className="muted-text">{plantMeta.message}</p>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{progress.totalCount}</strong>
            <span>累计天数</span>
          </div>
          <div className="stat-card">
            <strong>{progress.streakCount}</strong>
            <span>连续天数</span>
          </div>
          <div className="stat-card">
            <strong>{progress.nextStageAt || "已满"}</strong>
            <span>下一阶段</span>
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercent(progress.totalCount, progress.nextStageAt)}%` }}
          />
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={progress.checkedInToday || loading}
          onClick={onCheckin}
          data-testid="checkin-button"
        >
          {progress.checkedInToday ? "今天已经打卡" : loading ? "正在记录..." : "今天来打卡"}
        </button>
      </div>

      <div className="surface-card nested-card">
        <div className="eyebrow">养生小贴士</div>
        <h3>今天给自己一点轻柔提醒</h3>
        <p className="tip-copy">{tip}</p>
      </div>
    </section>
  );
}
