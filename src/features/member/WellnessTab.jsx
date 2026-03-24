import { getCurrentSeason, getCurrentWeekCheckinDots } from "../../lib/ui.js";
import { getPlantArtName, IllustrationIcon, pickFromList } from "../shared/IllustrationIcon.jsx";

export function WellnessTab({
  tips,
  onRefreshTips,
  checkinProgress,
  checkinLoading,
  onSubmitCheckin,
  plantMeta,
  progressPercent,
  notice,
}) {
  const season = getCurrentSeason();
  const weeklyDots = getCurrentWeekCheckinDots(checkinProgress.recentDates);

  return (
    <>
      <section className="plant-card">
        <div className="plant-top">
          <div>
            <div className="section-note">每日打卡，植物成长</div>
            <div className="section-title" style={{ marginTop: 8 }}>
              <h2 style={{ margin: 0 }}>当前时节 · {season}季养生</h2>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.8 }}>{plantMeta.message}</div>
          </div>
          <div className="plant-avatar">
            <IllustrationIcon
              name={getPlantArtName(checkinProgress.plantStage)}
              className="plant-illustration"
            />
          </div>
        </div>

        <div className="plant-stats">
          <div className="stat-card">
            <div className="stat-value">{checkinProgress.totalCount}</div>
            <div className="meta-subtitle">累计天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{checkinProgress.streakCount}</div>
            <div className="meta-subtitle">连续天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>
              {checkinProgress.plantStage}
            </div>
            <div className="meta-subtitle">成长阶段</div>
          </div>
        </div>

        <div className="meta-subtitle">距离下一阶段还有一点点进度</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="meta-subtitle">
          {checkinProgress.nextStageAt
            ? `累计达到 ${checkinProgress.nextStageAt} 天，就会进入下一阶段。`
            : "已经进入最繁盛阶段，继续保持这份稳定的节奏。"}
        </div>

        <div className="section-note" style={{ marginTop: 10 }}>本周打卡</div>
        <div className="day-dots">
          {weeklyDots.map((day) => (
            <div className="day-dot-item" key={day.key}>
              <span
                className={`day-dot ${day.active ? "active" : ""} ${day.isToday ? "today" : ""}`}
                title={`周${day.label}${day.active ? "已打卡" : "未打卡"}`}
                data-testid="checkin-week-dot"
                data-active={day.active ? "true" : "false"}
                data-today={day.isToday ? "true" : "false"}
              />
              <span className={`day-dot-label ${day.isToday ? "today" : ""}`}>{day.label}</span>
            </div>
          ))}
        </div>

        <div className="button-row" style={{ marginTop: 18 }}>
          <button
            type="button"
            className="primary-button"
            onClick={onSubmitCheckin}
            disabled={checkinLoading}
            data-testid="checkin-button"
          >
            {checkinLoading
              ? "记录中..."
              : checkinProgress.checkedInToday
                ? "今天已经打卡"
                : "今天来打卡"}
          </button>
        </div>
        {notice?.message ? (
          <div className={notice.tone === "error" ? "error-text" : "success-text"} style={{ marginTop: 12 }}>
            {notice.message}
          </div>
        ) : null}
      </section>

      <section className="section-title">
        <h2>养生小贴士</h2>
        <button type="button" className="secondary-button" onClick={onRefreshTips}>
          <IllustrationIcon name="sparkle" className="inline-art-icon" /> 换一批新贴士
        </button>
      </section>

      <div className="tip-list">
        {tips.map((tip, index) => (
          <article className="tip-card" key={`${tip.icon}-${tip.tip}`}>
            <span
              className="tip-stripe"
              style={{
                background:
                  index % 3 === 0
                    ? "linear-gradient(180deg, var(--primary), rgba(107, 175, 123, 0.25))"
                    : index % 3 === 1
                      ? "linear-gradient(180deg, var(--yellow), rgba(232, 200, 88, 0.2))"
                      : "linear-gradient(180deg, var(--peach), rgba(242, 168, 133, 0.25))",
              }}
            />
            <div className="tip-icon">
              <IllustrationIcon
                name={pickFromList(`${tip.tip}:${index}`, [
                  "wellness",
                  "leaf",
                  "sparkle",
                  "bloom",
                ])}
                className="tip-illustration"
              />
            </div>
            <div className="tip-text">{tip.tip}</div>
          </article>
        ))}
      </div>
    </>
  );
}
