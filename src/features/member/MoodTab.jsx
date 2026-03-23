import { useMemo, useState } from "react";
import { CUSTOM_MOOD_ICONS, MOODS } from "../../lib/constants.js";
import { formatDateTime, getReplyBadge } from "../../lib/format.js";

export function MoodTab({
  moodItems,
  customMoods,
  latestReply,
  unreadCount,
  onLogMood,
  onAddCustomMood,
  onDeleteCustomMood,
  onMarkRepliesRead,
}) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftIcon, setDraftIcon] = useState(CUSTOM_MOOD_ICONS[0]);
  const unreadReplyIds = useMemo(
    () =>
      moodItems
        .flatMap((item) => item.replies || [])
        .filter((reply) => !reply.isRead)
        .map((reply) => reply.id),
    [moodItems]
  );

  async function submitCustomMood(event) {
    event.preventDefault();
    if (!draftLabel.trim()) {
      return;
    }
    const created = await onAddCustomMood({
      label: draftLabel,
      icon: draftIcon,
    });
    if (created) {
      setDraftLabel("");
      setDraftIcon(CUSTOM_MOOD_ICONS[0]);
    }
  }

  return (
    <section className="stack-block">
      <div className="surface-card hero-card">
        <div className="header-row">
          <div>
            <div className="eyebrow">今天感觉怎么样</div>
            <h2>点一下就能记下来</h2>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => onMarkRepliesRead(unreadReplyIds)}
            >
              标记回复已读
            </button>
          ) : null}
        </div>

        <div className="mood-grid">
          {MOODS.map((mood) => (
            <button
              type="button"
              key={mood.key}
              className="mood-button"
              onClick={() => onLogMood({ moodKey: mood.key })}
              data-testid={`mood-${mood.key}`}
            >
              <span>{mood.icon}</span>
              <strong>{mood.label}</strong>
            </button>
          ))}
          {customMoods.map((mood) => (
            <div key={mood.id} className="mood-card custom-card">
              <button
                type="button"
                className="mood-button mood-button-custom"
                onClick={() => onLogMood({ customMoodId: mood.id })}
              >
                <span>{mood.icon}</span>
                <strong>{mood.label}</strong>
              </button>
              <button
                type="button"
                className="icon-button danger"
                onClick={() => onDeleteCustomMood(mood.id)}
                aria-label={`删除自定义心情 ${mood.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <form className="surface-card nested-card" onSubmit={submitCustomMood}>
        <div className="header-row">
          <div>
            <div className="eyebrow">添加自己的心情</div>
            <p className="muted-text">最多保留 12 个，用你习惯的词去记录。</p>
          </div>
        </div>

        <div className="field-row">
          <input
            className="text-input"
            placeholder="例如：踏实、挂念、想出门"
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            data-testid="custom-mood-label"
          />
          <button type="submit" className="secondary-button" data-testid="custom-mood-submit">
            添加心情
          </button>
        </div>

        <div className="emoji-grid">
          {CUSTOM_MOOD_ICONS.map((icon) => (
            <button
              type="button"
              key={icon}
              className={`emoji-pill ${draftIcon === icon ? "is-active" : ""}`}
              onClick={() => setDraftIcon(icon)}
            >
              {icon}
            </button>
          ))}
        </div>
      </form>

      <div className="surface-card nested-card">
        <div className="header-row">
          <div>
            <div className="eyebrow">最新回复</div>
            <h3>有人在看，也有人在关心</h3>
          </div>
          <span className={`status-pill ${unreadCount > 0 ? "warning" : "success"}`}>
            {unreadCount > 0 ? `${unreadCount} 条未读` : "已读完"}
          </span>
        </div>

        {latestReply ? (
          <div className="reply-card">
            <div className="reply-body">{latestReply.content}</div>
            <div className="muted-text">
              {latestReply.moodIcon} {latestReply.moodLabel} · {formatDateTime(latestReply.createdAt)}
            </div>
          </div>
        ) : (
          <div className="empty-card">还没有新的回复，先把今天的感受轻轻记下来。</div>
        )}
      </div>

      <div className="surface-card nested-card">
        <div className="header-row">
          <div>
            <div className="eyebrow">最近心情记录</div>
            <h3>每一条都只属于你自己</h3>
          </div>
        </div>

        <div className="stack-list">
          {moodItems.length ? (
            moodItems.map((item) => {
              const badge = getReplyBadge(item.replyStatus);
              return (
                <article className="list-card" key={item.id} data-testid="mood-history-item">
                  <div className="header-row">
                    <div>
                      <strong>{item.icon} {item.label}</strong>
                      <div className="muted-text">{formatDateTime(item.createdAt)}</div>
                    </div>
                    <span className={`status-pill ${badge.tone}`}>{badge.label}</span>
                  </div>

                  {item.replies?.length ? (
                    <div className="stack-list tight">
                      {item.replies.map((reply) => (
                        <div className="reply-card" key={reply.id}>
                          <div className="reply-body">{reply.content}</div>
                          <div className="muted-text">{formatDateTime(reply.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted-text">还没有新的回复，先把当下感受记下来就很好。</div>
                  )}
                </article>
              );
            })
          ) : (
            <div className="empty-card">今天还没有心情记录，先选一张情绪卡片开始吧。</div>
          )}
        </div>
      </div>
    </section>
  );
}
