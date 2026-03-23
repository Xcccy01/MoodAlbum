import { USER_COOKIE } from "../config/constants.js";
import { asyncHandler } from "../lib/async-handler.js";
import {
  clearSessionCookie,
  parseCookies,
  readSessionValue,
  shouldUseSecureCookies,
} from "../lib/security.js";
import { getMembershipContextByUserId } from "../modules/common/data.js";

export function attachRequestContext({ config, database }) {
  return asyncHandler(async (req, res, next) => {
    req.context = {
      user: null,
      household: null,
      membership: null,
      capabilities: {
        canAccessCare: false,
        canManageInvites: false,
      },
    };

    const cookies = parseCookies(req.headers.cookie);
    const payload = readSessionValue(cookies[USER_COOKIE], config.sessionSecret);
    if (!payload?.userId) {
      next();
      return;
    }

    const membershipContext = await getMembershipContextByUserId(database, payload.userId);
    if (!membershipContext?.user) {
      clearSessionCookie(res, shouldUseSecureCookies(req, config.secureCookies));
      next();
      return;
    }

    req.context = membershipContext;
    next();
  });
}
