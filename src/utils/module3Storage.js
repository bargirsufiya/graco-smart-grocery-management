export const INVENTORY_KEY = "graco_module3_inventory";
export const EXPENSES_KEY = "graco_module3_expenses";
export const BUDGETS_KEY = "graco_module3_budgets";

export function readUserRecords(key, userId) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || "[]");

    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter((record) => record.userId === userId);
  } catch {
    return [];
  }
}

export function writeUserRecords(key, userId, userRecords) {
  try {
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    const otherUsersRecords = Array.isArray(records)
      ? records.filter((record) => record.userId !== userId)
      : [];

    localStorage.setItem(
      key,
      JSON.stringify([
        ...otherUsersRecords,
        ...userRecords.map((record) => ({ ...record, userId })),
      ])
    );

    return true;
  } catch {
    return false;
  }
}

export function currentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${now.getFullYear()}-${month}`;
}

export function createRecordId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function monthExpenseTotal(expenses, month) {
  return expenses
    .filter((expense) => expense.date?.startsWith(month))
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

export function formatAmount(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}