import { useMemo, useState } from "react";
import { api } from "../../lib/api.js";

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
    <div className="screen-center">
      <form className="surface-card auth-panel" onSubmit={submit}>
        <div className="eyebrow">公开版</div>
        <h1>创建你的家庭空间</h1>
        <p className="muted-text">
          注册后可以创建自己的家庭，邀请家人加入，再由家人回复彼此的心情记录。
        </p>

        <div className="segmented-control">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>

        <label className="field-block">
          <span>用户名</span>
          <input
            className="text-input"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="2 到 20 位中文、字母、数字、下划线或短横线"
            autoComplete="username"
            data-testid="auth-username"
          />
        </label>

        <label className="field-block">
          <span>密码</span>
          <input
            className="text-input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="至少 6 位"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            data-testid="auth-password"
          />
        </label>

        {error ? <div className="message-banner error">{error}</div> : null}

        <button type="submit" className="primary-button" disabled={Boolean(busy)} data-testid="auth-submit">
          {busy || (mode === "login" ? "登录并进入" : "创建账号并进入")}
        </button>
      </form>
    </div>
  );
}
