import { useEffect, useState } from "react";
import {
  currentMonthValue,
  formatAmount,
  getBudget,
  listRecords,
  monthExpenseTotal,
  saveBudget as saveBudgetRecord,
} from "../utils/module3Api";

function Budget() {
  const [expenses, setExpenses] = useState([]);
  const [activeBudget, setActiveBudget] = useState(null);
  const initialMonth = currentMonthValue();
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const budgetAmount = Number(activeBudget?.amount || 0);
  const expenseTotal = monthExpenseTotal(expenses, selectedMonth);
  const remaining = budgetAmount - expenseTotal;
  const isOverBudget = budgetAmount > 0 && remaining < 0;
  const utilization = budgetAmount > 0 ? Math.round((expenseTotal / budgetAmount) * 100) : 0;
  const visibleUtilization = Math.min(Math.max(utilization, 0), 100);
  const monthExpenseRecords = expenses
    .filter((expense) => expense.date?.startsWith(selectedMonth))
    .sort((first, second) => second.date.localeCompare(first.date));

  useEffect(() => {
    let active = true;

    const loadBudgetData = async () => {
      setLoading(true);
      setError("");

      try {
        const [budget, monthExpenses] = await Promise.all([
          getBudget(selectedMonth),
          listRecords("expenses", selectedMonth),
        ]);
        if (active) {
          setActiveBudget(budget);
          setAmountInput(budget ? String(budget.amount) : "");
          setExpenses(monthExpenses);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBudgetData();

    return () => { active = false; };
  }, [selectedMonth, reloadKey]);

  const selectMonth = (month) => {
    setSelectedMonth(month);
    setAmountInput("");
    setError("");
  };

  const saveBudget = async (event) => {
    event.preventDefault();
    const amount = Number(amountInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a monthly budget greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveBudgetRecord(selectedMonth, amount);
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="rounded-2xl bg-emerald-50/80 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Monthly budget</h1>
          <p className="mt-1 text-sm text-gray-600">Budget totals use the expense records for the selected month.</p>
        </div>

        {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">Retry</button></div>}

        <section className="mb-5 rounded-md border border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
            <label className="text-sm font-medium text-gray-700">Month
              <input type="month" required value={selectedMonth} onChange={(event) => { if (event.target.value) selectMonth(event.target.value); }} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5" />
            </label>
            <form onSubmit={saveBudget} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 text-sm font-medium text-gray-700">Monthly grocery budget
                <input type="number" min="0.01" step="0.01" required disabled={loading || saving} value={amountInput} onChange={(event) => setAmountInput(event.target.value)} placeholder={activeBudget ? String(activeBudget.amount) : "Enter amount"} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 disabled:bg-gray-100" />
              </label>
              <button type="submit" disabled={loading || saving} className="rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? "Saving..." : activeBudget ? "Update budget" : "Set budget"}</button>
            </form>
          </div>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label={`${monthLabel} budget summary`}>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Monthly budget</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : budgetAmount > 0 ? formatAmount(budgetAmount) : "Not set"}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Expenses in {monthLabel}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{loading || error ? "-" : formatAmount(expenseTotal)}</p>
          </div>
          <div className={`rounded-md border p-4 ${isOverBudget ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
            <p className="text-sm text-gray-600">{!budgetAmount ? "Remaining" : isOverBudget ? "Over budget by" : "Remaining"}</p>
            <p className={`mt-1 text-2xl font-bold ${isOverBudget ? "text-red-800" : "text-gray-900"}`}>{loading || error ? "-" : budgetAmount > 0 ? formatAmount(Math.abs(remaining)) : "Set a budget"}</p>
          </div>
        </section>

        <section className="mb-6 rounded-md border border-gray-200 bg-white p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Budget utilization</h2>
            <span className={`text-sm font-semibold ${utilization >= 100 ? "text-red-700" : utilization >= 80 ? "text-amber-700" : "text-gray-700"}`}>
              {loading || error ? "Unavailable" : budgetAmount > 0 ? `${utilization}%` : "Set a budget to see utilization"}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Budget utilization" aria-valuenow={budgetAmount > 0 ? utilization : 0} aria-valuemin="0" aria-valuemax="100">
            <div className={`h-full transition-[width] ${utilization >= 100 ? "bg-red-600" : utilization >= 80 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${visibleUtilization}%` }}></div>
          </div>
          {!loading && !error && budgetAmount > 0 && utilization >= 80 && (
            <p role="status" className={`mt-3 text-sm font-medium ${utilization >= 100 ? "text-red-800" : "text-amber-800"}`}>
              {utilization >= 100 ? "Your grocery spending has reached or exceeded this budget." : "Your grocery spending is approaching this budget."}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
            <h2 className="font-semibold text-gray-900">Expenses counted for {monthLabel}</h2>
          </div>
          {loading ? (
            <p role="status" className="px-5 py-8 text-sm text-gray-600">Loading budget and expenses...</p>
          ) : error ? (
            <p className="px-5 py-8 text-sm text-gray-600">Budget totals are unavailable until the backend responds.</p>
          ) : monthExpenseRecords.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-600">No expenses recorded for this month.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthExpenseRecords.slice(0, 8).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{expense.title}</p>
                    <p className="text-xs text-gray-500">{expense.date} · {expense.category}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-gray-900">{formatAmount(expense.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Budget;