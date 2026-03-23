import { useState } from "react";
import { APP_NAME } from "../../lib/constants.js";
import { api } from "../../lib/api.js";

export function OnboardingPage({ session, onSuccess, onLogout }) {
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
              先把家庭空间搭起来
            </div>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>

        <p className="meta-subtitle auth-copy">
          一个账号只属于一个家庭。你可以创建自己的家庭，也可以用家人给的邀请码加入。
        </p>
        <div className="section-note">
          已经加入过家庭的账号，后续登录会直接进入主页，不会重复显示这个页面。
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {notice ? <div className="success-text">{notice}</div> : null}
        {busy ? <div className="section-note">{busy}</div> : null}

        <div className="stack-list">
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
              className="secondary-button"
              disabled={Boolean(busy)}
              data-testid="join-household-submit"
            >
              {busy === "正在加入家庭..." ? busy : "加入家庭"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
