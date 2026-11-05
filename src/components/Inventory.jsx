import { useEffect, useMemo, useState } from "react";
import {
  createRecord,
  deleteRecord,
  formatAmount,
  listRecords,
  updateRecord,
} from "../utils/module3Api";

const categories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Meat", "Pantry", "Other"];

const emptyForm = {
  name: "",
  category: "Fruits",
  quantity: "1",
  unit: "pcs",
  purchasePrice: "",
  expiryDate: "",
  lowStockThreshold: "2",
};

function daysUntilExpiry(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const expiry = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((expiry - today) / 86400000);
}

function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadInventory = async () => {
      setLoading(true);
      setError("");

      try {
        const records = await listRecords("inventory");
        if (active) setItems(records);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInventory();

    return () => { active = false; };
  }, [reloadKey]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const lowStockItems = items.filter(
    (item) => Number(item.quantity) <= Number(item.lowStockThreshold)
  );
  const expiryItems = items.filter((item) => {
    const days = daysUntilExpiry(item.expiryDate);

    return days !== null && days <= 7;
  });
  const inventoryValue = items.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.purchasePrice),
    0
  );

  const openNewItemForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      purchasePrice: String(item.purchasePrice),
      expiryDate: item.expiryDate || "",
      lowStockThreshold: String(item.lowStockThreshold),
    });
    setFormOpen(true);
    setError("");
  };

  const saveItem = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const purchasePrice = Number(form.purchasePrice);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (!form.name.trim() || !Number.isFinite(quantity) || quantity < 0 ||
      !Number.isFinite(purchasePrice) || purchasePrice < 0 ||
      !Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
      setError("Enter an item name, a non-negative quantity and price, and a valid low-stock threshold.");
      return;
    }

    const savedItem = {
      name: form.name.trim(),
      category: form.category,
      quantity,
      unit: form.unit,
      purchasePrice,
      expiryDate: form.expiryDate,
      lowStockThreshold,
    };

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateRecord("inventory", editingId, savedItem);
      } else {
        await createRecord("inventory", savedItem);
      }
      setFormOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.name} from inventory?`)) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await deleteRecord("inventory", item.id);
      setItems((currentItems) => currentItems.filter((entry) => entry.id !== item.id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="rounded-2xl bg-emerald-50/80 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="mt-1 text-sm text-gray-600">Track available grocery stock, prices, quantities, and expiry.</p>
          </div>
          <button type="button" onClick={openNewItemForm} disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
            Add item
          </button>
        </div>

        {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Retry</button></div>}

        {!loading && !error && (lowStockItems.length > 0 || expiryItems.length > 0) && (
          <section aria-label="Inventory alerts" className="mb-6 grid gap-3 md:grid-cols-2">
            {lowStockItems.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
                <h2 className="font-semibold">Low stock ({lowStockItems.length})</h2>
                <p className="mt-1 text-sm">{lowStockItems.map((item) => `${item.name} (${item.quantity} ${item.unit})`).join(", ")}</p>
              </div>
            )}
            {expiryItems.length > 0 && (
              <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-950">
                <h2 className="font-semibold">Expiry alert ({expiryItems.length})</h2>
                <p className="mt-1 text-sm">{expiryItems.map((item) => {
                  const days = daysUntilExpiry(item.expiryDate);
                  return `${item.name} (${days < 0 ? "expired" : days === 0 ? "expires today" : `${days} days left`})`;
                }).join(", ")}</p>
              </div>
            )}
          </section>
        )}

        <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Inventory summary">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Tracked items</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : items.length}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Low-stock items</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{loading || error ? "-" : lowStockItems.length}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Stock value at purchase price</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : formatAmount(inventoryValue)}</p>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search inventory</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inventory" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5" />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 sm:min-w-48">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>

        {formOpen && (
          <section className="mb-6 rounded-md border border-emerald-200 bg-emerald-50/60 p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">{editingId ? "Edit inventory item" : "Add inventory item"}</h2>
            <form onSubmit={saveItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">Item name
                <input autoFocus required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Category
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">Quantity
                <input type="number" min="0" step="any" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Unit
                <select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  {["pcs", "kg", "g", "liter", "ml", "pack", "dozen"].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">Purchase price
                <input type="number" min="0" step="0.01" required value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Expiry date
                <input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Low-stock alert at
                <input type="number" min="0" step="any" required value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-3">
                <button type="button" onClick={() => { setFormOpen(false); setError(""); }} className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Save item"}</button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {loading ? (
            <p role="status" className="px-6 py-12 text-center text-sm text-gray-600">Loading inventory...</p>
          ) : error ? (
            <p className="px-6 py-12 text-center text-sm text-gray-600">Inventory is unavailable until the backend responds.</p>
          ) : items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h2 className="font-semibold text-gray-900">No inventory items yet</h2>
              <p className="mt-1 text-sm text-gray-600">Add grocery stock to start tracking quantity, price, and expiry.</p>
              <button type="button" onClick={openNewItemForm} className="mt-4 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">Add first item</button>
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-600">No inventory items match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const expiryDays = daysUntilExpiry(item.expiryDate);
                    const isLow = Number(item.quantity) <= Number(item.lowStockThreshold);
                    const isExpired = expiryDays !== null && expiryDays < 0;
                    const isNearExpiry = expiryDays !== null && expiryDays >= 0 && expiryDays <= 7;

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-700">{item.category}</td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3 text-gray-700">{formatAmount(item.purchasePrice)}</td>
                        <td className="px-4 py-3 text-gray-700">{item.expiryDate || "Not set"}</td>
                        <td className="px-4 py-3">
                          {isLow && <span className="mr-1 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Low stock</span>}
                          {(isExpired || isNearExpiry) && <span className="inline-block rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-900">{isExpired ? "Expired" : "Expiring soon"}</span>}
                          {!isLow && !isExpired && !isNearExpiry && <span className="text-gray-500">In stock</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button type="button" onClick={() => editItem(item)} className="font-medium text-emerald-800 hover:underline" aria-label={`Edit ${item.name}`}>Edit</button>
                            <button type="button" onClick={() => deleteItem(item)} className="font-medium text-red-700 hover:underline" aria-label={`Delete ${item.name}`}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Inventory;