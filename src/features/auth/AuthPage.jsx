import { useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { APP_NAME } from "../../lib/constants.js";
import { IllustrationIcon } from "../shared/IllustrationIcon.jsx";

const LAST_USERNAME_KEY = "mood-album-last-username";

export function AuthPage({ onSuccess }) {
  const rememberedUsername = useMemo(
    () => window.localStorage.getItem(LAST_USERNAME_KEY) || "",
    []
  );
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: rememberedUsername,
    password: "",
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(mode === "login" ? "正在登录..." : "正在创建账号...");
    setError("");

    try {
      await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      window.localStorage.setItem(LAST_USERNAME_KEY, form.username.trim());
      await onSuccess();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card auth-card auth-panel" onSubmit={submit}>
        <div className="auth-orb auth-orb-left" />
        <div className="auth-orb auth-orb-right" />
        <div className="section-note">{APP_NAME}</div>
        <div className="meta-title" style={{ fontSize: 32, marginTop: 10 }}>
          登录后开始记录今天
        </div>
        <p className="meta-subtitle auth-copy">
          每个家庭的数据彼此隔离。登录后，回复端和记录端会按你的角色自动进入对应流程。
        </p>

        <div className="toggle-row auth-toggle">
          <button
            type="button"
            className={`pill-button ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={`pill-button ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>

        <div className="field">
          <label>用户名</label>
          <input
            className="text-input"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="2 到 20 位中文、字母、数字、下划线或短横线"
            autoComplete="username"
            data-testid="auth-username"
          />
        </div>

        <div className="field">
          <label>密码</label>
          <input
            className="text-input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="至少 6 位"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            data-testid="auth-password"
          />
        </div>

        <div className="auth-hint">
          <span>
            <IllustrationIcon name="clover" className="inline-art-icon" /> 家庭成员共享同一个家庭空间
          </span>
          <span>
            <IllustrationIcon name="leaf" className="inline-art-icon" /> 回复权限由家庭角色控制
          </span>
        </div>

        {rememberedUsername ? (
          <div className="remember-row">
            <span className="section-note">上次登录账号：{rememberedUsername}</span>
            {form.username !== rememberedUsername ? (
              <button
                type="button"
                className="ghost-button remember-button"
                onClick={() => setForm((prev) => ({ ...prev, username: rememberedUsername }))}
              >
                一键填入
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="error-text">{error}</div> : null}
        {busy ? <div className="section-note">{busy}</div> : null}
        <button
          type="submit"
          className="primary-button"
          style={{ width: "100%", marginTop: 8 }}
          disabled={Boolean(busy)}
          data-testid="auth-submit"
        >
          {mode === "login" ? "进入应用" : "创建账号并进入"}
        </button>
      </form>
    </div>
  );
}
