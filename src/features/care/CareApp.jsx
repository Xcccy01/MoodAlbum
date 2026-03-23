import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api.js";
import { formatDateTime, getReplyBadge } from "../../lib/format.js";

export function CareApp({ session, onNavigate, onLogout, onRequestError }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState([]);
  const [moods, setMoods] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [invites, setInvites] = useState([]);
  const [inviteRole, setInviteRole] = useState("member");

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadMoods();
  }, [filterStatus, selectedMemberId]);

  useEffect(() => {
    if (selectedMoodId) {
      loadMoodDetail(selectedMoodId);
    } else {
      setSelectedMood(null);
    }
  }, [selectedMoodId]);

  async function runRequest(label, task, successMessage) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await task();
      if (successMessage) {
        setNotice(successMessage);
      }
      return result;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onRequestError(requestError);
        return null;
      }
      setError(requestError.message);
      return null;
    } finally {
      setBusy("");
    }
  }

  async function loadBaseData() {
    await runRequest("正在加载家庭信息...", async () => {
      const [membersData, invitesData] = await Promise.all([
        api("/api/care/members"),
        session.capabilities.canManageInvites ? api("/api/care/invites") : Promise.resolve({ invites: [] }),
      ]);
      setMembers(membersData.members || []);
      setInvites(invitesData.invites || []);
    });
  }

  async function loadMoods() {
    const result = await runRequest("正在同步待回复列表...", async () => {
      const query = new URLSearchParams();
      query.set("status", filterStatus);
      if (selectedMemberId) {
        query.set("memberId", selectedMemberId);
      }
      return api(`/api/care/moods?${query.toString()}`);
    });

    if (result) {
      setMoods(result.items || []);
      setSelectedMoodId((prev) => {
        if (prev && result.items.some((item) => item.id === prev)) {
          return prev;
        }
        return result.items[0]?.id || "";
      });
    }
  }

  async function loadMoodDetail(moodId) {
    const result = await runRequest("正在加载心情详情...", async () => api(`/api/care/moods/${moodId}`));
    if (result) {
      setSelectedMood(result.mood);
    }
  }

  async function publishReply() {
    if (!selectedMoodId || !replyText.trim()) {
      return;
    }
    const result = await runRequest(
      "正在发布回复...",
      async () => api(`/api/care/moods/${selectedMoodId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content: replyText }),
      }),
      "回复已发布。"
    );
    if (result) {
      setReplyText("");
      await loadMoods();
      await loadMoodDetail(selectedMoodId);
    }
  }

  async function updateStatus(nextStatus) {
    if (!selectedMoodId) {
      return;
    }
    const result = await runRequest(
      nextStatus === "ignored" ? "正在设为暂不回复..." : "正在恢复待回复...",
      async () => api(`/api/care/moods/${selectedMoodId}/status`, {
        method: "POST",
        body: JSON.stringify({ replyStatus: nextStatus }),
      }),
      nextStatus === "ignored" ? "这条心情已设为暂不回复。" : "这条心情已恢复到待回复。"
    );
    if (result) {
      await loadMoods();
      await loadMoodDetail(selectedMoodId);
    }
  }

  async function createInvite() {
    const result = await runRequest(
      "正在生成邀请码...",
      async () => api("/api/care/invites", {
        method: "POST",
        body: JSON.stringify({ role: inviteRole }),
      }),
      "邀请码已生成。"
    );
    if (result) {
      setInvites((prev) => [result.invite, ...prev]);
    }
  }

  async function revokeInvite(inviteId) {
    const result = await runRequest(
      "正在撤销邀请码...",
      async () => api(`/api/care/invites/${inviteId}/revoke`, { method: "POST" }),
      "邀请码已撤销。"
    );
    if (result) {
      setInvites((prev) => prev.map((invite) => (
        invite.id === inviteId ? { ...invite, status: "revoked" } : invite
      )));
    }
  }

  return (
    <main className="page-shell care-shell">
      <header className="page-header">
        <div>
          <div className="eyebrow">{session.household.name}</div>
          <h1>家人回复端</h1>
          <p className="muted-text">查看家庭成员的心情记录，并温和地给出回应。</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("/")}>
            返回记录端
          </button>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </header>

      {error ? <div className="message-banner error">{error}</div> : null}
      {notice ? <div className="message-banner success">{notice}</div> : null}
      {busy ? <div className="message-banner info">{busy}</div> : null}

      <div className="care-toolbar">
        <div className="segmented-control">
          <button type="button" className={filterStatus === "pending" ? "is-active" : ""} onClick={() => setFilterStatus("pending")}>
            待回复
          </button>
          <button type="button" className={filterStatus === "ignored" ? "is-active" : ""} onClick={() => setFilterStatus("ignored")}>
            暂不回复
          </button>
          <button type="button" className={filterStatus === "all" ? "is-active" : ""} onClick={() => setFilterStatus("all")}>
            全部
          </button>
        </div>

        <select
          className="text-input select-input"
          value={selectedMemberId}
          onChange={(event) => setSelectedMemberId(event.target.value)}
        >
          <option value="">全部成员</option>
          {members.map((member) => (
            <option value={member.userId} key={member.userId}>
              {member.displayName} · {member.role}
            </option>
          ))}
        </select>
      </div>

      <div className="care-grid">
        <aside className="surface-card nested-card">
          <div className="header-row">
            <div>
              <div className="eyebrow">待处理心情</div>
              <h3>{moods.length} 条</h3>
            </div>
          </div>

          <div className="stack-list tight">
            {moods.length ? (
              moods.map((mood) => {
                const badge = getReplyBadge(mood.replyStatus);
                return (
                  <button
                    type="button"
                    key={mood.id}
                    className={`list-card selectable-card ${selectedMoodId === mood.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedMoodId(mood.id)}
                    data-testid="care-mood-item"
                  >
                    <div className="compact-row">
                      <strong>{mood.icon} {mood.label}</strong>
                      <span className={`status-pill ${badge.tone}`}>{badge.label}</span>
                    </div>
                    <div className="muted-text">{mood.user.displayName} · {formatDateTime(mood.createdAt)}</div>
                  </button>
                );
              })
            ) : (
              <div className="empty-card">当前筛选条件下没有心情记录。</div>
            )}
          </div>
        </aside>

        <section className="stack-block">
          {selectedMood ? (
            <>
              <article className="surface-card nested-card">
                <div className="header-row">
                  <div>
                    <div className="eyebrow">{selectedMood.user.displayName}</div>
                    <h3>{selectedMood.icon} {selectedMood.label}</h3>
                    <div className="muted-text">{formatDateTime(selectedMood.createdAt)}</div>
                  </div>
                  <span className={`status-pill ${getReplyBadge(selectedMood.replyStatus).tone}`}>
                    {getReplyBadge(selectedMood.replyStatus).label}
                  </span>
                </div>

                <div className="stack-list tight">
                  {selectedMood.replies?.length ? (
                    selectedMood.replies.map((reply) => (
                      <div className="reply-card" key={reply.id}>
                        <div className="reply-body">{reply.content}</div>
                        <div className="muted-text">
                          {reply.author.username} · {formatDateTime(reply.createdAt)} · {reply.isRead ? "已读" : "未读"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-card">这条心情还没有回复，可以在下面写一段温和的回应。</div>
                  )}
                </div>
              </article>

              <article className="surface-card nested-card">
                <div className="eyebrow">发布回复</div>
                <textarea
                  className="text-area"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="例如：收到这份心情了，今天辛苦了。先让自己慢一点，休息一下也很好。"
                  data-testid="care-reply-input"
                />
                <div className="header-actions">
                  <button type="button" className="primary-button" onClick={publishReply} data-testid="care-reply-submit">
                    发布回复
                  </button>
                  {selectedMood.replyStatus === "ignored" ? (
                    <button type="button" className="secondary-button" onClick={() => updateStatus("pending")}>
                      恢复待回复
                    </button>
                  ) : (
                    <button type="button" className="secondary-button" onClick={() => updateStatus("ignored")}>
                      暂不回复
                    </button>
                  )}
                </div>
              </article>
            </>
          ) : (
            <div className="surface-card nested-card empty-card">从左侧选一条心情记录，就可以开始查看详情并回复。</div>
          )}

          <article className="surface-card nested-card">
            <div className="header-row">
              <div>
                <div className="eyebrow">家庭成员</div>
                <h3>{members.length} 位成员</h3>
              </div>
            </div>
            <div className="stack-list tight">
              {members.map((member) => (
                <div className="compact-row" key={member.userId}>
                  <strong>{member.displayName}</strong>
                  <span className="muted-text">{member.role}</span>
                </div>
              ))}
            </div>
          </article>

          {session.capabilities.canManageInvites ? (
            <article className="surface-card nested-card">
              <div className="header-row">
                <div>
                  <div className="eyebrow">邀请码管理</div>
                  <h3>邀请家人加入你的家庭</h3>
                </div>
                <div className="header-actions">
                  <select
                    className="text-input select-input"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    data-testid="care-invite-role"
                  >
                    <option value="member">普通成员</option>
                    <option value="caregiver">回复者</option>
                  </select>
                  <button type="button" className="primary-button" onClick={createInvite} data-testid="care-create-invite">
                    生成邀请码
                  </button>
                </div>
              </div>

              <div className="stack-list tight">
                {invites.length ? (
                  invites.map((invite) => (
                    <div className="reply-card" key={invite.id}>
                      <div className="compact-row">
                        <strong data-testid="invite-code">{invite.code}</strong>
                        <span className={`status-pill ${invite.status === "active" ? "success" : "muted"}`}>
                          {invite.status}
                        </span>
                      </div>
                      <div className="compact-row">
                        <span className="muted-text">{invite.role} · 截止 {formatDateTime(invite.expiresAt)}</span>
                        {invite.status === "active" ? (
                          <button type="button" className="ghost-button danger-text" onClick={() => revokeInvite(invite.id)}>
                            撤销
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-card">还没有邀请码，先生成一个给家人。</div>
                )}
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
