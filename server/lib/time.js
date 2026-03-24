import { CHINA_TIME_ZONE, PLANT_STAGES } from "../config/constants.js";

export function nowIso() {
  return new Date().toISOString();
}

export function getChinaDateString(date = new Date()) {
  const values = getChinaDateParts(date);
  return `${values.year}-${values.month}-${values.day}`;
}

export function getChinaMonthKey(date = new Date()) {
  const values = getChinaDateParts(date);
  return `${values.year}-${values.month}`;
}

export function toDayNumber(dateString) {
  const normalized = normalizeDateOnly(dateString);
  const [year, month, day] = normalized.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

export function normalizeDateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value);
  return text.includes("T") ? text.slice(0, 10) : text;
}

export function getPlantStage(totalCount) {
  let current = PLANT_STAGES[0];
  for (const stage of PLANT_STAGES) {
    if (totalCount >= stage.threshold) {
      current = stage;
    }
  }
  return current;
}

export function getNextPlantStage(totalCount) {
  return PLANT_STAGES.find((stage) => stage.threshold > totalCount) || null;
}

function getChinaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const values = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return values;
}
