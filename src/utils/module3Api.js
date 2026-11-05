const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_MODE = Boolean(configuredApiUrl);
export const API_BASE_URL = configuredApiUrl?.replace(/\/+$/, "") || "";

const storageKeys = {
  inventory: "graco_module3_inventory",
  expenses: "graco_module3_expenses",
  budgets: "graco_module3_budgets",
};

function createRecordId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLocalRecords(resource) {
  const key = storageKeys[resource];

  if (!key) {
    throw new Error(`Unknown Module 3 resource: ${resource}`);
  }

  try {
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(records)) {
      throw new Error("Stored data has an invalid format.");
    }

    return records.map(normalizeRecord);
  } catch (error) {
    throw new Error(`Could not read ${resource}: ${error.message}`, { cause: error });
  }
}

function writeLocalRecords(resource, records) {
  const key = storageKeys[resource];

  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    throw new Error(`Could not save ${resource} in this browser. Check available storage and try again.`);
  }
}

function localListRecords(resource, month) {
  const records = readLocalRecords(resource);

  return resource === "expenses" && month
    ? records.filter((expense) => expense.date?.startsWith(month))
    : records;
}

function localCreateRecord(resource, record) {
  const records = readLocalRecords(resource);
  const savedRecord = {
    ...record,
    id: createRecordId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeLocalRecords(resource, [...records, savedRecord]);
  return savedRecord;
}

function localUpdateRecord(resource, id, changes) {
  const records = readLocalRecords(resource);
  const index = records.findIndex((record) => record.id === id);

  if (index === -1) {
    throw new Error(`The ${resource} record no longer exists. Refresh and try again.`);
  }

  const savedRecord = {
    ...records[index],
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  };
  records[index] = savedRecord;
  writeLocalRecords(resource, records);
  return savedRecord;
}

function localDeleteRecord(resource, id) {
  const records = readLocalRecords(resource);
  const remainingRecords = records.filter((record) => record.id !== id);

  if (remainingRecords.length === records.length) {
    throw new Error(`The ${resource} record no longer exists. Refresh and try again.`);
  }

  writeLocalRecords(resource, remainingRecords);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_BASE_URL}. Start the API server or set VITE_API_URL.`);
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();
  let payload = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(`The server at ${API_BASE_URL} did not return JSON. Confirm the Module 3 API routes are running.`);
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}.`);
  }

  return payload;
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") {
    return record;
  }

  return { ...record, id: record.id || record._id };
}

function normalizeList(payload) {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.records)
        ? payload.records
        : Array.isArray(payload?.data)
          ? payload.data
          : null;

  if (!records) {
    throw new Error("The API response must contain a list of records.");
  }

  return records.map(normalizeRecord);
}

function normalizeOne(payload) {
  const record = payload?.item || payload?.expense || payload?.budget || payload?.data || payload;

  return normalizeRecord(record);
}

export async function listRecords(resource, month) {
  if (!API_MODE) {
    return localListRecords(resource, month);
  }

  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  const payload = await request(`/${resource}${query}`);

  return normalizeList(payload);
}

export async function createRecord(resource, record) {
  if (!API_MODE) {
    return localCreateRecord(resource, record);
  }

  const payload = await request(`/${resource}`, {
    method: "POST",
    body: JSON.stringify(record),
  });

  return normalizeOne(payload);
}

export async function updateRecord(resource, id, record) {
  if (!API_MODE) {
    return localUpdateRecord(resource, id, record);
  }

  const payload = await request(`/${resource}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(record),
  });

  return normalizeOne(payload);
}

export async function deleteRecord(resource, id) {
  if (!API_MODE) {
    return localDeleteRecord(resource, id);
  }

  return request(`/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getBudget(month) {
  if (!API_MODE) {
    return readLocalRecords("budgets").find((budget) => budget.month === month) || null;
  }

  const payload = await request(`/budgets?month=${encodeURIComponent(month)}`);

  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return normalizeRecord(payload.find((budget) => budget.month === month) || null);
  }

  return normalizeOne(payload);
}

export async function saveBudget(month, amount) {
  if (!API_MODE) {
    const budgets = readLocalRecords("budgets");
    const existingBudget = budgets.find((budget) => budget.month === month);
    const savedBudget = {
      ...existingBudget,
      id: existingBudget?.id || createRecordId(),
      month,
      amount,
      updatedAt: new Date().toISOString(),
    };
    const updatedBudgets = existingBudget
      ? budgets.map((budget) => budget.month === month ? savedBudget : budget)
      : [...budgets, { ...savedBudget, createdAt: new Date().toISOString() }];

    writeLocalRecords("budgets", updatedBudgets);
    return savedBudget;
  }

  const payload = await request(`/budgets/${encodeURIComponent(month)}`, {
    method: "PUT",
    body: JSON.stringify({ month, amount }),
  });

  return normalizeOne(payload);
}

export function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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