export async function getMembershipContextByUserId(database, userId) {
  const result = await database.query(
    `
      SELECT
        u.id AS user_id,
        u.username,
        hm.household_id,
        hm.role,
        hm.display_name,
        h.name AS household_name
      FROM users u
      LEFT JOIN household_members hm ON hm.user_id = u.id
      LEFT JOIN households h ON h.id = hm.household_id
      WHERE u.id = $1
    `,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const membership = row.household_id
    ? {
        householdId: row.household_id,
        role: row.role,
        displayName: row.display_name,
      }
    : null;

  return {
    user: {
      id: row.user_id,
      username: row.username,
    },
    household: row.household_id
      ? {
          id: row.household_id,
          name: row.household_name,
        }
      : null,
    membership,
    capabilities: {
      canAccessCare: membership ? ["owner", "caregiver"].includes(membership.role) : false,
      canManageInvites: membership ? membership.role === "owner" : false,
    },
  };
}

export async function listHouseholdMembers(database, householdId) {
  const result = await database.query(
    `
      SELECT
        hm.user_id,
        hm.role,
        hm.display_name,
        u.username
      FROM household_members hm
      JOIN users u ON u.id = hm.user_id
      WHERE hm.household_id = $1
      ORDER BY
        CASE hm.role
          WHEN 'owner' THEN 0
          WHEN 'caregiver' THEN 1
          ELSE 2
        END,
        hm.joined_at ASC
    `,
    [householdId]
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
  }));
}
