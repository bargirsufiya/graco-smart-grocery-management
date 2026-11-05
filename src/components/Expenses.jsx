import { useEffect, useMemo, useState } from "react";
import {
  currentMonthValue,
  createRecord,
  deleteRecord,
  formatAmount,
  listRecords,
  updateRecord,
} from "../utils/module3Api";

const categories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Meat", "Pantry", "Other"];

function localDateValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

const emptyForm = {
  title: "",
  amount: "",
  category: "Other",
  date: localDateValue(),
  quantity: "",
  notes: "",
};

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedDate, setSelectedDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadExpenses = async () => {
      setLoading(true);
      setError("");

      try {
        const records = await listRecords("expenses", selectedMonth);
        if (active) setExpenses(records);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadExpenses();

    return () => { active = false; };
  }, [selectedMonth, reloadKey]);

  const monthExpenses = useMemo(() => expenses.filter((expense) => expense.date?.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const filteredExpenses = useMemo(() => monthExpenses
    .filter((expense) => !selectedDate || expense.date === selectedDate)
    .filter((expense) => categoryFilter === "all" || expense.category === categoryFilter)
    .sort((first, second) => second.date.localeCompare(first.date)), [monthExpenses, selectedDate, categoryFilter]);
  const monthTotal = monthExpenses.reduce((total, expense) => total + Number(expense.amount), 0);

  const editExpense = (expense) => {
    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      quantity: expense.quantity == null ? "" : String(expense.quantity),
      notes: expense.notes || "",
    });
    setFormOpen(true);
    setError("");
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const quantity = form.quantity === "" ? null : Number(form.quantity);

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date ||
      (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0))) {
      setError("Enter a title, a positive amount and date. Quantity must be positive when provided.");
      return;
    }

    const updatedExpense = {
      title: form.title.trim(),
      amount,
      category: form.category,
      date: form.date,
      quantity,
      notes: form.notes.trim(),
    };

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateRecord("expenses", editingId, updatedExpense);
      } else {
        await createRecord("expenses", updatedExpense);
      }
      setFormOpen(false);
      setSelectedMonth(updatedExpense.date.slice(0, 7));
      setSelectedDate("");
      setForm({ ...emptyForm, date: localDateValue() });
      setEditingId(null);
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense) => {
    if (!window.confirm(`Delete the expense "${expense.title}"?`)) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await deleteRecord("expenses", expense.id);
      setExpenses((currentExpenses) => currentExpenses.filter((entry) => entry.id !== expense.id));
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
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="mt-1 text-sm text-gray-600">Record grocery spending once and review it by month or category.</p>
          </div>
          <button type="button" disabled={saving} onClick={() => { setEditingId(null); setForm({ ...emptyForm, date: localDateValue() }); setFormOpen(true); setError(""); }} className="rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
            Add expense
          </button>
        </div>

        {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Retry</button></div>}

        <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Expense summary">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <label htmlFor="expense-month" className="text-sm text-gray-600">Selected month</label>
            <input id="expense-month" type="month" required value={selectedMonth} onChange={(event) => { if (event.target.value) { setSelectedMonth(event.target.value); setSelectedDate(""); } }} className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Total spending</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : formatAmount(monthTotal)}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Recorded expenses</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : monthExpenses.length}</p>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm text-gray-700">Filter by date
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="ml-2 rounded-md border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="ml-2 rounded-md border border-gray-300 bg-white px-3 py-2">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>

        {formOpen && (
          <section className="mb-6 rounded-md border border-emerald-200 bg-emerald-50/60 p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">{editingId ? "Edit expense" : "Add expense"}</h2>
            <form onSubmit={saveExpense} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">Title or item
                <input autoFocus required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Amount
                <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Category
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">Date
                <input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Quantity (optional)
                <input type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Notes (optional)
                <input maxLength={500} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" />
              </label>
              <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-3">
                <button type="button" onClick={() => { setFormOpen(false); setError(""); }} className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Save expense"}</button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
          {loading ? (
            <p role="status" className="px-6 py-12 text-center text-sm text-gray-600">Loading expenses...</p>
          ) : error ? (
            <p className="px-6 py-12 text-center text-sm text-gray-600">Expenses are unavailable until the backend responds.</p>
          ) : monthExpenses.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h2 className="font-semibold text-gray-900">No expenses for this month</h2>
              <p className="mt-1 text-sm text-gray-600">Add a grocery expense to see it included in the monthly budget.</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-600">No expenses match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Expense</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 text-gray-700">{expense.date}</td>
                      <td className="px-4 py-3"><span className="font-semibold text-gray-900">{expense.title}</span>{expense.notes && <p className="mt-1 max-w-xs truncate text-xs text-gray-500">{expense.notes}</p>}</td>
                      <td className="px-4 py-3 text-gray-700">{expense.category}</td>
                      <td className="px-4 py-3 text-gray-700">{expense.quantity ?? "-"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatAmount(expense.amount)}</td>
                      <td className="px-4 py-3"><div className="flex gap-3">
                        <button type="button" onClick={() => editExpense(expense)} className="font-medium text-emerald-800 hover:underline" aria-label={`Edit ${expense.title}`}>Edit</button>
                        <button type="button" onClick={() => deleteExpense(expense)} className="font-medium text-red-700 hover:underline" aria-label={`Delete ${expense.title}`}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Expenses;