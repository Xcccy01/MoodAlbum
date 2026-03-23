import { useState } from "react";
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
      await api("/api/households", {
        method: "POST",
        body: JSON.stringify({ name: createName }),
      });
      setNotice("家庭创建完成。");
      await onSuccess();
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
      await api("/api/household-invites/join", {
        method: "POST",
        body: JSON.stringify({ code: inviteCode }),
      });
      setNotice("你已经加入家庭。");
      await onSuccess();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="screen-center">
      <div className="surface-card onboarding-panel">
        <div className="header-row">
          <div>
            <div className="eyebrow">欢迎，{session.user.username}</div>
            <h1>先把家庭空间搭起来</h1>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>

        <p className="muted-text">
          一个账号只属于一个家庭。你可以创建自己的家庭，也可以用家人给的邀请码加入。
        </p>

        {error ? <div className="message-banner error">{error}</div> : null}
        {notice ? <div className="message-banner success">{notice}</div> : null}

        <div className="two-column-grid">
          <form className="surface-card nested-card" onSubmit={createHousehold}>
            <div className="eyebrow">创建家庭</div>
            <label className="field-block">
              <span>家庭名称</span>
              <input
                className="text-input"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="例如：王阿姨一家"
                data-testid="create-household-name"
              />
            </label>
            <button
              type="submit"
              className="primary-button"
              disabled={Boolean(busy)}
              data-testid="create-household-submit"
            >
              {busy === "正在创建家庭..." ? busy : "创建家庭"}
            </button>
          </form>

          <form className="surface-card nested-card" onSubmit={joinHousehold}>
            <div className="eyebrow">加入家庭</div>
            <label className="field-block">
              <span>邀请码</span>
              <input
                className="text-input"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="输入 8 位邀请码"
                data-testid="join-household-code"
              />
            </label>
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
