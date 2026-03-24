import assert from "node:assert/strict";
import test from "node:test";
import { APP_TIME_ZONE } from "../../src/lib/constants.js";
import { formatDate, formatDateTime } from "../../src/lib/format.js";
import { getAdminReplyState } from "../../src/lib/ui.js";

function captureDateTimeFormatCalls(task) {
  const originalDateTimeFormat = Intl.DateTimeFormat;
  const calls = [];

  function WrappedDateTimeFormat(locale, options) {
    calls.push({ locale, options });
    return new originalDateTimeFormat(locale, options);
  }

  WrappedDateTimeFormat.prototype = originalDateTimeFormat.prototype;
  WrappedDateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf.bind(
    originalDateTimeFormat
  );
  Object.setPrototypeOf(WrappedDateTimeFormat, originalDateTimeFormat);

  Intl.DateTimeFormat = WrappedDateTimeFormat;
  try {
    task();
  } finally {
    Intl.DateTimeFormat = originalDateTimeFormat;
  }

  return calls;
}

test("前端时间格式化统一使用应用时区", () => {
  const calls = captureDateTimeFormatCalls(() => {
    formatDateTime("2026-03-31T16:30:00.000Z");
    formatDate("2026-03-31T16:30:00.000Z");
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.timeZone, APP_TIME_ZONE);
  assert.equal(calls[1].options.timeZone, APP_TIME_ZONE);
});

test("回复端列表摘要会根据未读数量显示状态", () => {
  assert.equal(
    getAdminReplyState({
      replyStatus: "replied",
      replyCount: 1,
      unreadReplyCount: 1,
    }),
    "unread"
  );

  assert.equal(
    getAdminReplyState({
      replyStatus: "replied",
      replyCount: 1,
      unreadReplyCount: 0,
    }),
    "read"
  );
});
