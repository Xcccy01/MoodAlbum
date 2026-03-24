import assert from "node:assert/strict";
import test from "node:test";
import { APP_TIME_ZONE } from "../../src/lib/constants.js";
import { formatDate, formatDateTime } from "../../src/lib/format.js";
import { getAdminReplyState, getCurrentWeekCheckinDots } from "../../src/lib/ui.js";

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

test("打卡圆点会按当前周的一到日对应点亮", () => {
  const dots = getCurrentWeekCheckinDots(
    ["2026-03-23", "2026-03-25", "2026-03-29"],
    new Date("2026-03-26T10:00:00+08:00")
  );

  assert.equal(dots.length, 7);
  assert.deepEqual(
    dots.map((item) => item.label),
    ["一", "二", "三", "四", "五", "六", "日"]
  );
  assert.deepEqual(
    dots.map((item) => item.key),
    [
      "2026-03-23",
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
    ]
  );
  assert.deepEqual(
    dots.map((item) => item.active),
    [true, false, true, false, false, false, true]
  );
  assert.equal(dots[3].isToday, true);
});
