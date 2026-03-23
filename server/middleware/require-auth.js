export function requireAuth(req, res, next) {
  if (!req.context?.user) {
    res.status(401).json({ error: "请先登录。" });
    return;
  }
  next();
}

export function requireHousehold(req, res, next) {
  if (!req.context?.household || !req.context?.membership) {
    res.status(409).json({ error: "请先创建家庭或通过邀请码加入家庭。" });
    return;
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.context?.user) {
      res.status(401).json({ error: "请先登录。" });
      return;
    }
    if (!req.context?.membership) {
      res.status(409).json({ error: "请先加入家庭。" });
      return;
    }
    if (!roles.includes(req.context.membership.role)) {
      res.status(403).json({ error: "你没有访问这里的权限。" });
      return;
    }
    next();
  };
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "未找到对应资源。" });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (res.headersSent) {
    return;
  }
  res.status(error.statusCode || 500).json({
    error: error.message || "服务器发生了一点问题。",
  });
}
