import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api.js";
import { formatDateTime, getReplyBadge } from "../../lib/format.js";
import { getAdminReplyState } from "../../lib/ui.js";
import { getMoodArtName, IllustrationIcon } from "../shared/IllustrationIcon.jsx";

function handleRequestError(requestError, onRequestError, setError) {
  if (requestError instanceof ApiError && requestError.status === 401) {
    onRequestError(requestError);
    return;
  }

  setError(requestError.message);
}

function getRoleLabel(role) {
  if (role === "owner") return "家庭管理员";
  if (role === "caregiver") return "回复者";
  return "普通成员";
}

export function CareApp({ session, onLogout, onRequestError }) {
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
    void loadBaseData();
  }, []);

  useEffect(() => {
    void loadMoods();
  }, [filterStatus, selectedMemberId]);

  useEffect(() => {
    if (!selectedMoodId) {
      setSelectedMood(null);
      return;
    }

    void loadMoodDetail(selectedMoodId);
  }, [selectedMoodId]);

  useEffect(() => {
    if (!moods.length) {
      setSelectedMoodId("");
      setSelectedMood(null);
      return;
    }

    const exists = moods.some((item) => item.id === selectedMoodId);
    if (!exists) {
      setSelectedMoodId(moods[0].id);
      setReplyText("");
    }
  }, [moods, selectedMoodId]);

  async function runRequest(label, task, successMessage = "") {
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
      handleRequestError(requestError, onRequestError, setError);
      return null;
    } finally {
      setBusy("");
    }
  }

  async function loadBaseData() {
    await runRequest("正在加载家庭信息...", async () => {
      const [membersData, invitesData] = await Promise.all([
        api("/api/care/members"),
        session.capabilities.canManageInvites
          ? api("/api/care/invites")
          : Promise.resolve({ invites: [] }),
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
    }
  }

  async function loadMoodDetail(moodId) {
    const result = await runRequest(
      "正在加载心情详情...",
      async () => api(`/api/care/moods/${moodId}`)
    );
    if (result) {
      setSelectedMood(result.mood || null);
    }
  }

  async function publishReply() {
    if (!selectedMoodId || !replyText.trim()) {
      return;
    }

    const result = await runRequest(
      "正在发布回复...",
      async () =>
        api(`/api/care/moods/${selectedMoodId}/replies`, {
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
      async () =>
        api(`/api/care/moods/${selectedMoodId}/status`, {
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
      async () =>
        api("/api/care/invites", {
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
      setInvites((prev) =>
        prev.map((invite) =>
          invite.id === inviteId ? { ...invite, status: "revoked" } : invite
        )
      );
    }
  }

  const selectedMoodState = getAdminReplyState(selectedMood);

  return (
    <div className="admin-shell">
      <div className="header-card admin-header-card">
        <div className="date-row">
          <span className="section-note">家人回复端 · {session.user.username}</span>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>
        <div className="greeting-row">
          <div>
            <h1>手动回复心情诉求</h1>
            <div className="section-note">
              待处理会优先显示。发布后，对方会在记录端看到新的回复提醒。
            </div>
          </div>
          <div className="leaf-badge">
            <IllustrationIcon name="message" />
          </div>
        </div>
      </div>

      {error ? <div className="error-text" style={{ marginBottom: 12 }}>{error}</div> : null}
      {notice ? <div className="success-text" style={{ marginBottom: 12 }}>{notice}</div> : null}
      {busy ? <div className="section-note" style={{ marginBottom: 12 }}>{busy}</div> : null}

      <div className="admin-toolbar care-toolbar" style={{ marginBottom: 16 }}>
        <div className="care-filter-row">
          <button
            type="button"
            className={`pill-button ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            待处理
          </button>
          <button
            type="button"
            className={`pill-button ${filterStatus === "ignored" ? "active" : ""}`}
            onClick={() => setFilterStatus("ignored")}
          >
            暂不回复
          </button>
          <button
            type="button"
            className={`pill-button ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            全部记录
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
              {member.displayName} · {getRoleLabel(member.role)}
            </option>
          ))}
        </select>
      </div>

      <article className="admin-card" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h3>家庭成员与邀请</h3>
          <span className="section-note">
            {session.household.name} · {members.length} 位成员
          </span>
        </div>

        <div className="care-summary-grid">
          {members.length ? (
            members.map((member) => (
              <div className="care-summary-item" key={member.userId}>
                <div style={{ fontWeight: 800 }}>{member.displayName}</div>
                <div className="meta-subtitle" style={{ marginTop: 6 }}>
                  {getRoleLabel(member.role)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-card">当前还没有家庭成员。</div>
          )}
        </div>

        {session.capabilities.canManageInvites ? (
          <>
            <div className="divider" style={{ marginTop: 18 }}>
              <span>邀请码管理</span>
            </div>
            <div className="button-row care-invite-row" style={{ marginBottom: 16 }}>
              <select
                className="text-input select-input"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                data-testid="care-invite-role"
              >
                <option value="member">普通成员</option>
                <option value="caregiver">回复者</option>
              </select>
              <button
                type="button"
                className="primary-button"
                onClick={createInvite}
                data-testid="care-create-invite"
              >
                生成邀请码
              </button>
            </div>

            <div className="reply-stack">
              {invites.length ? (
                invites.map((invite) => (
                  <div className="reply-item" key={invite.id}>
                    <div className="row-between" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800 }} data-testid="invite-code">
                          {invite.code}
                        </div>
                        <div className="meta-subtitle" style={{ marginTop: 6 }}>
                          {getRoleLabel(invite.role)} · 截止 {formatDateTime(invite.expiresAt)}
                        </div>
                      </div>
                      <div className="button-row" style={{ gap: 8 }}>
                        <span
                          className={`status-pill ${
                            invite.status === "active" ? "replied" : "ignored"
                          }`}
                        >
                          {invite.status === "active" ? "有效" : "已撤销"}
                        </span>
                        {invite.status === "active" ? (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => revokeInvite(invite.id)}
                          >
                            撤销
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-card">还没有邀请码，先生成一个给家人。</div>
              )}
            </div>
          </>
        ) : null}
      </article>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h3>心情列表</h3>
          <span className="section-note">当前加载 {moods.length} 条</span>
        </div>
        <div className="admin-list">
          {moods.length === 0 ? (
            <div className="empty-card">当前没有符合条件的记录。</div>
          ) : (
            moods.map((mood) => (
              <button
                type="button"
                key={mood.id}
                className={`admin-list-item ${selectedMoodId === mood.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedMoodId(mood.id === selectedMoodId ? "" : mood.id);
                  setReplyText("");
                }}
                data-testid="care-mood-item"
              >
                <div className="row-between">
                  <div className="admin-mood-meta">
                    <div className="mini-emoji">
                      <IllustrationIcon
                        name={getMoodArtName(mood.moodKey, mood.label, mood.icon)}
                        className="card-illustration"
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>{mood.label}</div>
                      <div className="meta-subtitle">
                        {mood.user?.displayName || mood.user?.username || "未命名用户"} ·{" "}
                        {formatDateTime(mood.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className={`status-pill ${getReplyBadge(getAdminReplyState(mood)).tone}`}>
                    {getReplyBadge(getAdminReplyState(mood)).label}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedMood ? (
        <>
          <article className="admin-card" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <h3>心情详情</h3>
              <span className={`status-pill ${getReplyBadge(selectedMoodState).tone}`}>
                {getReplyBadge(selectedMoodState).label}
              </span>
            </div>
            <div className="mood-meta">
              <div className="emoji-box">
                <IllustrationIcon
                  name={getMoodArtName(
                    selectedMood.moodKey,
                    selectedMood.label,
                    selectedMood.icon
                  )}
                  className="card-illustration"
                />
              </div>
              <div>
                <div className="meta-title">{selectedMood.label}</div>
                <div className="meta-subtitle">
                  {selectedMood.user?.displayName ||
                    selectedMood.user?.username ||
                    "未命名用户"}{" "}
                  · {formatDateTime(selectedMood.createdAt)}
                </div>
              </div>
            </div>
            <div className="divider" style={{ marginTop: 18 }}>
              <span>历史回复</span>
            </div>
            {selectedMood.replies.length ? (
              <div className="reply-stack">
                {selectedMood.replies.map((reply) => (
                  <div className="reply-item" key={reply.id}>
                    <div style={{ lineHeight: 1.8 }}>{reply.content}</div>
                    <div className="meta-subtitle" style={{ marginTop: 6 }}>
                      {formatDateTime(reply.createdAt)} · {reply.isRead ? "已读" : "未读"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-card">这条心情还没有回复，可以在下面写一段温和的回应。</div>
            )}
          </article>

          <article className="admin-card" style={{ marginBottom: 16 }}>
            <div className="section-title">
              <h3>发布回复</h3>
            </div>
            <div className="field">
              <label>回复内容</label>
              <textarea
                className="text-area"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="例如：收到这份心情了，今天辛苦了。先让自己慢一点，喝口温水，休息一下也很好。"
                data-testid="care-reply-input"
              />
            </div>
            <div className="button-row" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className="primary-button"
                onClick={publishReply}
                data-testid="care-reply-submit"
              >
                发布回复
              </button>
              {selectedMood.replyStatus === "ignored" ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => updateStatus("pending")}
                >
                  恢复待回复
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => updateStatus("ignored")}
                >
                  暂不回复
                </button>
              )}
              <button
                type="button"
                className="ghost-button"
                onClick={() => setReplyText("")}
              >
                清空
              </button>
            </div>
          </article>
        </>
      ) : moods.length > 0 ? (
        <div className="empty-card">点击上方的心情记录，查看详情并回复。</div>
      ) : null}
    </div>
  );
}
