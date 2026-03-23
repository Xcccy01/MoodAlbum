import express from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { randomId } from "../../lib/security.js";
import { getChinaDateString, getNextPlantStage, getPlantStage, nowIso, toDayNumber } from "../../lib/time.js";
import { requireHousehold } from "../../middleware/require-auth.js";

async function getCheckinProgress(database, householdId, userId) {
  const today = getChinaDateString();

  const latestResult = await database.query(
    `
      SELECT checkin_date, streak_count, total_count, plant_stage
      FROM checkins
      WHERE household_id = $1 AND user_id = $2
      ORDER BY checkin_date DESC
      LIMIT 1
    `,
    [householdId, userId]
  );

  const recentResult = await database.query(
    `
      SELECT checkin_date
      FROM checkins
      WHERE household_id = $1 AND user_id = $2
      ORDER BY checkin_date DESC
      LIMIT 14
    `,
    [householdId, userId]
  );

  const latest = latestResult.rows[0];
  const totalCount = Number(latest?.total_count || 0);
  const stage = getPlantStage(Math.max(totalCount, 1));
  const nextStage = getNextPlantStage(totalCount);

  return {
    checkedInToday: latest?.checkin_date === today,
    streakCount: Number(latest?.streak_count || 0),
    totalCount,
    plantStage: totalCount === 0 ? "种子" : latest.plant_stage || stage.stage,
    plantEmoji: totalCount === 0 ? "🌰" : stage.emoji,
    nextStageAt: nextStage?.threshold || null,
    recentDates: recentResult.rows.map((row) => row.checkin_date),
  };
}

export function createCheckinsRouter({ database }) {
  const router = express.Router();

  router.get(
    "/checkins/progress",
    requireHousehold,
    asyncHandler(async (req, res) => {
      res.json(await getCheckinProgress(database, req.context.household.id, req.context.user.id));
    })
  );

  router.post(
    "/checkins",
    requireHousehold,
    asyncHandler(async (req, res) => {
      const householdId = req.context.household.id;
      const userId = req.context.user.id;
      const today = getChinaDateString();

      const existing = await database.query(
        `
          SELECT id
          FROM checkins
          WHERE household_id = $1 AND user_id = $2 AND checkin_date = $3
        `,
        [householdId, userId, today]
      );

      if (existing.rowCount > 0) {
        res.json(await getCheckinProgress(database, householdId, userId));
        return;
      }

      const latestResult = await database.query(
        `
          SELECT checkin_date, streak_count, total_count
          FROM checkins
          WHERE household_id = $1 AND user_id = $2
          ORDER BY checkin_date DESC
          LIMIT 1
        `,
        [householdId, userId]
      );

      const latest = latestResult.rows[0];
      const previousDayNumber = latest ? toDayNumber(latest.checkin_date) : null;
      const todayDayNumber = toDayNumber(today);
      const streakCount =
        latest && previousDayNumber !== null && todayDayNumber - previousDayNumber === 1
          ? Number(latest.streak_count) + 1
          : 1;
      const totalCount = Number(latest?.total_count || 0) + 1;
      const plantStage = getPlantStage(totalCount).stage;

      await database.query(
        `
          INSERT INTO checkins (
            id, household_id, user_id, checkin_date, streak_count, total_count, plant_stage, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [randomId(), householdId, userId, today, streakCount, totalCount, plantStage, nowIso()]
      );

      res.status(201).json(await getCheckinProgress(database, householdId, userId));
    })
  );

  return router;
}
