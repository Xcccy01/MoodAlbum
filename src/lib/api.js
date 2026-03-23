export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isJsonBody = options.body && !(options.body instanceof FormData) && !headers.has("Content-Type");
  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  const method = String(options.method || "GET").toUpperCase();
  const response = await fetch(path, {
    credentials: "include",
    cache: options.cache || (method === "GET" ? "no-store" : "default"),
    ...options,
    headers,
  });

  const raw = await response.text();
  const data = raw ? safeJsonParse(raw) : {};

  if (!response.ok) {
    throw new ApiError(data?.error || "请求失败。", response.status, data);
  }

  return data;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
