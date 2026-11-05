// Module 2 grocery list API, backed by the Module 4 /api/lists routes.
// Converts the MongoDB records into the shape GroceryApp.jsx expects.

import { apiRequest } from "./apiClient";

const PRIORITIES = { high: "High", medium: "Medium", low: "Low" };

export const toPriority = (value) =>
  PRIORITIES[String(value || "").toLowerCase()] || "Medium";

const normalizeItem = (item) => ({
  ...item,
  id: item._id || item.id,
  assignedTo: item.assignedTo || null,
});

export const normalizeList = (list) => ({
  ...list,
  id: list._id || list.id,
  items: (list.items || []).map(normalizeItem),
  // Module 4 roles: owner / editor / viewer. Module 2 checks permission === "edit".
  permission: list.myRole === "viewer" ? "view" : "edit",
});

const toItemPayload = (item) => {
  const payload = { ...item };

  if (payload.priority !== undefined) {
    payload.priority = toPriority(payload.priority);
  }

  // Module 2 sends "purchased" when ticking an item off
  if (payload.purchased !== undefined) {
    payload.completed = payload.purchased;
    delete payload.purchased;
  }

  return payload;
};

export async function getGroceryLists() {
  const lists = await apiRequest("/lists");
  return { lists: lists.map(normalizeList) };
}

export async function getGroceryList(listId) {
  const list = await apiRequest(`/lists/${listId}`);
  return { list: normalizeList(list) };
}

export async function getSharedWithMe() {
  const lists = await apiRequest("/lists/shared-with-me");
  return { lists: lists.map(normalizeList) };
}

export async function createGroceryList(name) {
  const list = await apiRequest("/lists", { method: "POST", body: { name } });
  return { list: normalizeList(list) };
}

export async function renameGroceryList(listId, name) {
  const list = await apiRequest(`/lists/${listId}`, { method: "PUT", body: { name } });
  return { list: normalizeList(list) };
}

export async function deleteGroceryList(listId) {
  return apiRequest(`/lists/${listId}`, { method: "DELETE" });
}

export async function addGroceryItem(listId, item) {
  const list = await apiRequest(`/lists/${listId}/items`, {
    method: "POST",
    body: toItemPayload(item),
  });
  return { list: normalizeList(list) };
}

export async function updateGroceryItem(listId, itemId, changes) {
  const list = await apiRequest(`/lists/${listId}/items/${itemId}`, {
    method: "PUT",
    body: toItemPayload(changes),
  });
  return { list: normalizeList(list) };
}

export async function deleteGroceryItem(listId, itemId) {
  const list = await apiRequest(`/lists/${listId}/items/${itemId}`, {
    method: "DELETE",
  });
  return { list: normalizeList(list) };
}
