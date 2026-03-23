import { CUSTOM_MOOD_ICONS, MOODS } from "../../lib/constants.js";
import { formatDateTime, getReplyBadge } from "../../lib/format.js";
import { getMemberReplyState } from "../../lib/ui.js";
import {
  CUSTOM_MOOD_ARTS,
  getMoodArtName,
  getMoodDecorationArtName,
  IllustrationIcon,
  pickFromList,
} from "../shared/IllustrationIcon.jsx";

export function MoodTab({
  moodItems,
  latestReply,
  unreadCount,
  customMoods,
  showCustomMoodPanel,
  setShowCustomMoodPanel,
  customMoodForm,
  setCustomMoodForm,
  moodSubmitting,
  onSubmitMood,
  onSubmitCustomMood,
  onCreateCustomMood,
  onDeleteCustomMood,
}) {
  return (
    <>
      {latestReply ? (
        <section className={`banner ${unreadCount > 0 ? "is-unread" : ""}`}>
          <div className="row-between">
            <div>
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IllustrationIcon name="message" className="inline-art-icon" />
                <span>最新回复</span>
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.8 }}>{latestReply.content}</div>
              <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
                <IllustrationIcon
                  name={getMoodArtName(
                    latestReply.moodKey,
                    latestReply.moodLabel,
                    latestReply.moodIcon
                  )}
                  className="inline-art-icon"
                />{" "}
                {latestReply.moodLabel} · {formatDateTime(latestReply.createdAt)}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-title">
          <h2>今天感觉怎么样</h2>
          <span className="section-note">点一下就能记下来</span>
        </div>
        <div className="mood-cloud">
          {MOODS.map((mood) => (
            <button
              type="button"
              key={mood.key}
              className={`mood-bubble ${mood.size}`}
              disabled={moodSubmitting === mood.key}
              style={{
                top: mood.position.top,
                left: mood.position.left,
                "--rotation": mood.rotate,
                transform: `rotate(${mood.rotate})`,
                background: `linear-gradient(145deg, ${mood.accent}, rgba(255,255,255,0.28))`,
              }}
              onClick={() => onSubmitMood(mood)}
              data-testid={`mood-${mood.key}`}
            >
              <span className="mood-icon">
                <IllustrationIcon
                  name={getMoodArtName(mood.key, mood.label, mood.icon)}
                  className="bubble-illustration"
                />
              </span>
              <span className="mood-label">
                {moodSubmitting === mood.key ? "记录中..." : mood.label}
              </span>
              <span className="mood-decoration">
                <IllustrationIcon
                  name={getMoodDecorationArtName(mood.key)}
                  className="mini-illustration"
                />
              </span>
            </button>
          ))}
        </div>

        <div className="divider" style={{ marginTop: 18 }}>
          <span>
            <IllustrationIcon name="sparkle" className="inline-art-icon" /> 添加自己的心情
          </span>
        </div>

        <div className="button-row" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowCustomMoodPanel((prev) => !prev)}
          >
            {showCustomMoodPanel ? "收起添加面板" : "添加心情"}
          </button>
          <span className="section-note">最多 12 个，点一下也能直接记录。</span>
        </div>

        {showCustomMoodPanel ? (
          <div className="inline-panel custom-mood-editor" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>心情名称</label>
              <input
                className="text-input"
                value={customMoodForm.label}
                onChange={(event) =>
                  setCustomMoodForm((prev) => ({ ...prev, label: event.target.value }))
                }
                placeholder="例如：踏实、想出门、有点想念"
                maxLength={12}
                data-testid="custom-mood-label"
              />
            </div>
            <div className="field">
              <label>选择图标</label>
              <div className="icon-grid">
                {CUSTOM_MOOD_ARTS.map((artName, index) => (
                  <button
                    type="button"
                    key={artName}
                    className={`icon-chip ${customMoodForm.icon === CUSTOM_MOOD_ICONS[index] ? "active" : ""}`}
                    onClick={() =>
                      setCustomMoodForm((prev) => ({
                        ...prev,
                        icon: CUSTOM_MOOD_ICONS[index],
                      }))
                    }
                  >
                    <IllustrationIcon name={artName} className="picker-illustration" />
                  </button>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="primary-button"
                onClick={onCreateCustomMood}
                data-testid="custom-mood-submit"
              >
                确认添加
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowCustomMoodPanel(false)}
              >
                取消
              </button>
            </div>
          </div>
        ) : null}

        <div className="custom-mood-list">
          {customMoods.length === 0 ? (
            <div className="empty-card">
              还没有自定义心情。可以补充更贴近自己日常表达的状态，比如“踏实”“想散步”“有点想念”。
            </div>
          ) : (
            customMoods.map((mood) => (
              <div className="custom-mood-pill" key={mood.id}>
                <button
                  type="button"
                  className="custom-mood-main"
                  disabled={moodSubmitting === mood.id}
                  onClick={() => onSubmitCustomMood(mood)}
                >
                  <span className="custom-mood-icon">
                    <IllustrationIcon
                      name={pickFromList(
                        `${mood.id}:${mood.label}:${mood.icon}`,
                        CUSTOM_MOOD_ARTS
                      )}
                      className="bubble-illustration"
                    />
                  </span>
                  <span>{moodSubmitting === mood.id ? "记录中..." : mood.label}</span>
                </button>
                <button
                  type="button"
                  className="custom-mood-remove"
                  onClick={() => onDeleteCustomMood(mood.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="divider">
        <span>
          <IllustrationIcon name="message" className="inline-art-icon" /> 最近心情记录
        </span>
      </div>

      <section className="list-stack">
        {moodItems.length === 0 ? (
          <div className="empty-card">
            还没有记录。点一下上面的心情气泡，就会从这里开始留下今天的状态。
          </div>
        ) : (
          moodItems.map((item) => {
            const badge = getReplyBadge(getMemberReplyState(item));
            return (
              <article className="list-card" key={item.id} data-testid="mood-history-item">
                <div className="row-between">
                  <div className="mood-meta">
                    <div className="emoji-box">
                      <IllustrationIcon
                        name={getMoodArtName(item.moodKey, item.label, item.icon)}
                        className="card-illustration"
                      />
                    </div>
                    <div>
                      <div className="meta-title">{item.label}</div>
                      <div className="meta-subtitle">{formatDateTime(item.createdAt)}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${badge.tone}`}>{badge.label}</span>
                </div>
                {item.replies.length ? (
                  <div className="reply-stack">
                    {item.replies.map((reply) => (
                      <div className="reply-item" key={reply.id}>
                        <div style={{ fontSize: 15, lineHeight: 1.75 }}>{reply.content}</div>
                        <div className="meta-subtitle" style={{ marginTop: 6 }}>
                          {formatDateTime(reply.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="meta-subtitle" style={{ marginTop: 12 }}>
                    还没有新的回复，先把当下感受记下来就很好。
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
