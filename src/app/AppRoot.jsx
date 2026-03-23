import { Suspense, lazy, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api.js";

const AuthPage = lazy(() =>
  import("../features/auth/AuthPage.jsx").then((module) => ({ default: module.AuthPage }))
);
const OnboardingPage = lazy(() =>
  import("../features/onboarding/OnboardingPage.jsx").then((module) => ({
    default: module.OnboardingPage,
  }))
);
const MemberApp = lazy(() =>
  import("../features/member/MemberApp.jsx").then((module) => ({ default: module.MemberApp }))
);
const CareApp = lazy(() =>
  import("../features/care/CareApp.jsx").then((module) => ({ default: module.CareApp }))
);

function LoadingScreen({ text }) {
  return (
    <div className="screen-center">
      <div className="surface-card auth-panel">
        <div className="eyebrow">MoodAlbum</div>
        <h1>{text}</h1>
        <p className="muted-text">稍等一下，正在恢复你的登录状态和家庭信息。</p>
      </div>
    </div>
  );
}

function NoCareAccess({ onGoHome }) {
  return (
    <div className="screen-center">
      <div className="surface-card auth-panel">
        <div className="eyebrow">无权限</div>
        <h1>这个入口只对家人回复者开放</h1>
        <p className="muted-text">如果你只是记录自己的心情、养生和记账内容，请返回主页继续使用。</p>
        <button type="button" className="primary-button" onClick={onGoHome}>
          返回主页
        </button>
      </div>
    </div>
  );
}

function normalizePath(pathname) {
  if (pathname.startsWith("/admin")) {
    return "/care";
  }
  if (pathname.startsWith("/care")) {
    return "/care";
  }
  return "/";
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AppRoot() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const [session, setSession] = useState({
    checking: true,
    authenticated: false,
    user: null,
    household: null,
    membership: null,
    capabilities: {
      canAccessCare: false,
      canManageInvites: false,
    },
  });

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      window.history.replaceState({}, "", "/care");
    }

    const handlePopState = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    refreshSession();
  }, []);

  async function refreshSession() {
    try {
      const result = await api("/api/me");
      setSession({
        checking: false,
        authenticated: Boolean(result.authenticated),
        user: result.user,
        household: result.household,
        membership: result.membership,
        capabilities: result.capabilities,
      });
    } catch {
      setSession((prev) => ({
        ...prev,
        checking: false,
        authenticated: false,
        user: null,
        household: null,
        membership: null,
        capabilities: {
          canAccessCare: false,
          canManageInvites: false,
        },
      }));
    }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setSession({
        checking: false,
        authenticated: false,
        user: null,
        household: null,
        membership: null,
        capabilities: {
          canAccessCare: false,
          canManageInvites: false,
        },
      });
      navigateTo("/");
    }
  }

  function handleRequestError(error) {
    if (error instanceof ApiError && error.status === 401) {
      refreshSession();
    }
  }

  if (session.checking) {
    return <LoadingScreen text="正在准备公开版空间" />;
  }

  if (!session.authenticated) {
    return (
      <Suspense fallback={<LoadingScreen text="正在载入登录入口" />}>
        <AuthPage onSuccess={refreshSession} />
      </Suspense>
    );
  }

  if (!session.household) {
    return (
      <Suspense fallback={<LoadingScreen text="正在载入家庭向导" />}>
        <OnboardingPage session={session} onSuccess={refreshSession} onLogout={logout} />
      </Suspense>
    );
  }

  if (pathname === "/care") {
    if (!session.capabilities.canAccessCare) {
      return <NoCareAccess onGoHome={() => navigateTo("/")} />;
    }

    return (
      <Suspense fallback={<LoadingScreen text="正在载入家人回复端" />}>
        <CareApp
          session={session}
          onNavigate={navigateTo}
          onLogout={logout}
          onRequestError={handleRequestError}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen text="正在载入家庭主页" />}>
      <MemberApp
        session={session}
        onNavigate={navigateTo}
        onLogout={logout}
        onRequestError={handleRequestError}
      />
    </Suspense>
  );
}
