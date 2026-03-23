import { useState } from "react";
import { APP_NAME } from "../../lib/constants.js";
import { api } from "../../lib/api.js";

const CLIENT_CONTENT = {
  member: {
    title: "输入邀请码后开始记录",
    subtitle: "这里是发送心情端。成员通过邀请码加入家庭后，就能记录心情、打卡和记账。",
    note: "创建家庭和生成邀请码请前往家庭创建与回复端完成。",
    allowCreate: false,
    allowJoin: true,
    switchLabel: "去家庭创建与回复端",
  },
  care: {
    title: "先把家庭空间搭起来",
    subtitle: "这里是家庭创建与回复端。你可以创建家庭，也可以作为回复者通过邀请码加入。",
    note: "创建完成后，可以在这里管理邀请码并回复家庭成员的心情。",
    allowCreate: true,
    allowJoin: true,
    switchLabel: "去发送心情端",
  },
};

export function OnboardingPage({
  session,
  onSuccess,
  onLogout,
  client = "member",
  onSwitchClient,
}) {
  const content = CLIENT_CONTENT[client] || CLIENT_CONTENT.member;
  const [createName, setCreateName] = useState(`${session.user.username}的家庭`);
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createHousehold(event) {
    event.preventDefault();
    setBusy("正在创建家庭...");
    setError("");
    setNotice("");
    try {
      const result = await api("/api/households", {
        method: "POST",
        body: JSON.stringify({ name: createName }),
      });
      setNotice("家庭创建完成。");
      await onSuccess(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function joinHousehold(event) {
    event.preventDefault();
    setBusy("正在加入家庭...");
    setError("");
    setNotice("");
    try {
      const result = await api("/api/household-invites/join", {
        method: "POST",
        body: JSON.stringify({ code: inviteCode }),
      });
      setNotice("你已经加入家庭。");
      await onSuccess(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card auth-card onboarding-panel">
        <div className="auth-orb auth-orb-left" />
        <div className="auth-orb auth-orb-right" />
        <div className="row-between">
          <div>
            <div className="section-note">{APP_NAME}</div>
            <div className="meta-title" style={{ fontSize: 30, marginTop: 8 }}>
              {content.title}
            </div>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>

        <p className="meta-subtitle auth-copy">
          {content.subtitle}
        </p>
        <div className="section-note">
          {content.note}
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {notice ? <div className="success-text">{notice}</div> : null}
        {busy ? <div className="section-note">{busy}</div> : null}

        <div className="stack-list">
          {content.allowCreate ? (
            <form className="panel onboarding-card" onSubmit={createHousehold}>
              <div className="section-title">
                <h3>创建家庭</h3>
                <span className="section-note">作为家庭发起者开始使用</span>
              </div>
              <div className="field">
                <label>家庭名称</label>
                <input
                  className="text-input"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="例如：王阿姨一家"
                  data-testid="create-household-name"
                />
              </div>
              <button
                type="submit"
                className="primary-button"
                disabled={Boolean(busy)}
                data-testid="create-household-submit"
              >
                {busy === "正在创建家庭..." ? busy : "创建家庭"}
              </button>
            </form>
          ) : null}

          {content.allowJoin ? (
            <form className="panel onboarding-card" onSubmit={joinHousehold}>
              <div className="section-title">
                <h3>加入家庭</h3>
                <span className="section-note">用邀请码进入家人的家庭</span>
              </div>
              <div className="field">
                <label>邀请码</label>
                <input
                  className="text-input"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  placeholder="输入 8 位邀请码"
                  data-testid="join-household-code"
                />
              </div>
              <button
                type="submit"
                className={content.allowCreate ? "secondary-button" : "primary-button"}
                disabled={Boolean(busy)}
                data-testid="join-household-submit"
              >
                {busy === "正在加入家庭..." ? busy : "加入家庭"}
              </button>
            </form>
          ) : null}
        </div>

        <button
          type="button"
          className="ghost-button"
          style={{ width: "100%", marginTop: 12 }}
          onClick={onSwitchClient}
        >
          {content.switchLabel}
        </button>
      </div>
    </div>
  );
}
