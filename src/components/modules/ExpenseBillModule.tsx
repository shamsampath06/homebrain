import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { BillItem, ExpenseCategory } from '../../types';
import { formatINR } from '../../lib/display';
import { PageHeader } from '../layout/PageHeader';
import { DollarSign, Plus, Zap, PieChart, CreditCard, CheckCircle2, AlertCircle, X, Calendar } from 'lucide-react';

export const ExpenseCard: React.FC = () => {
  const { expenses, bills, navigateToSubScreen } = useHomeBrain();

  const now = new Date();
  const currentMonthSpending = expenses
    .filter(expense => {
      const date = new Date(`${expense.date}T00:00:00`);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthlySpending = currentMonthSpending > 0
    ? currentMonthSpending
    : expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const upcomingBills = bills.filter(b => !b.isPaid);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Expense & Bill Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Household Financial Overview</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('expense')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Analytics →
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-700/50 border border-amber-200/60 dark:border-slate-600 mt-2">
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            {now.toLocaleString('en-US', { month: 'long' })} Household Spending
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatINR(totalMonthlySpending)}
          </p>
          {upcomingBills.length > 0 && (
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-500" /> Next Due: {upcomingBills[0].title} ({formatINR(upcomingBills[0].amount)})
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={() => navigateToSubScreen('add-expense')}
          className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
        <button
          onClick={() => navigateToSubScreen('bill-management')}
          className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1"
        >
          <CreditCard className="w-4 h-4 text-amber-500" /> Manage Bills
        </button>
      </div>
    </div>
  );
};

export const ExpenseDashboardScreen: React.FC = () => {
  const { expenses, bills, navigateToSubScreen, setActiveSubScreen, deleteExpense, currentUser } = useHomeBrain();
  const [spaceFilter, setSpaceFilter] = useState<'all' | 'shared' | 'personal'>('all');

  const filteredExpenses = expenses.filter(exp => {
    const isMine = exp.userId === currentUser.id || exp.payer === currentUser.name;
    if (spaceFilter === 'personal') return exp.isPersonal && isMine;
    if (spaceFilter === 'shared') return !exp.isPersonal;
    return !exp.isPersonal || isMine;
  });

  const totalSpending = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Group by category for simple progress bar analytics
  const categoriesMap: { [key: string]: number } = {};
  filteredExpenses.forEach(e => {
    categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Expense & Bill Intelligence"
        subtitle="Monitor family spending, categorize household budget, and track due bills"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToSubScreen('bill-management')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-amber-500" /> View Bills Tracker ({bills.filter(b => !b.isPaid).length} Due)
            </button>
            <button
              onClick={() => navigateToSubScreen('add-expense')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        }
      />

      {/* Space Toggle: Family Shared vs Personal */}
      <div className="flex p-1 rounded-2xl bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setSpaceFilter('all')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'all'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          All Expenses
        </button>
        <button
          onClick={() => setSpaceFilter('shared')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'shared'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          👨‍👩‍👧‍👦 Shared Family
        </button>
        <button
          onClick={() => setSpaceFilter('personal')}
          className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
            spaceFilter === 'personal'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          🔒 Private Personal
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500">Total Monthly Household Spending</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{formatINR(totalSpending)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Updated in real-time from database</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-card border border-slate-200 dark:border-slate-700 col-span-2">
          <p className="text-xs font-semibold text-slate-500 mb-3">Spending Breakdown by Category</p>
          <div className="space-y-2.5">
            {Object.entries(categoriesMap).map(([cat, amount]) => {
              const percent = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                    <span className="text-slate-600 dark:text-slate-400">{formatINR(amount)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Recent Household Expenses</h3>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">No expenses logged in this space yet.</p>
            <button
              onClick={() => navigateToSubScreen('add-expense')}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Log First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
          {filteredExpenses.map(exp => (
            <div
              key={exp.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{exp.title}</p>
                  {exp.isPersonal ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      🔒 Personal
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      👨‍👩‍👧‍👦 Family
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {exp.date} • Paid by <span className="font-semibold text-slate-700 dark:text-slate-300">{exp.payer}</span> • Category: {exp.category}
                </p>
                {exp.description && <p className="text-xs text-slate-400 mt-0.5">{exp.description}</p>}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-base font-black text-slate-900 dark:text-white">{formatINR(exp.amount)}</span>
                <button
                  onClick={() => navigateToSubScreen('edit-expense', exp.id)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${exp.title}?`)) deleteExpense(exp.id);
                  }}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export const AddExpenseModal: React.FC = () => {
  const { addExpense, updateExpense, expenses, selectedItemId, activeSubScreen, setActiveSubScreen, currentUser } = useHomeBrain();
  const existing = expenses.find(expense => expense.id === selectedItemId);
  const editing = activeSubScreen === 'edit-expense' && Boolean(existing);
  const [title, setTitle] = useState(existing?.title || '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category || 'Groceries');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [payer, setPayer] = useState(existing?.payer || currentUser.name);
  const [description, setDescription] = useState(existing?.description || '');
  const [isPersonal, setIsPersonal] = useState(existing?.isPersonal || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const payload = {
      title,
      amount: parseFloat(amount),
      category,
      date,
      payer,
      description,
      isPersonal,
      userId: currentUser.id,
      createdByName: currentUser.name
    };
    if (editing && existing) updateExpense(existing.id, payload);
    else addExpense(payload);

    setActiveSubScreen('expense');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Household Expense' : 'Record New Household Expense'}
        subtitle="Log transactions, assign category allocations, and track payer details"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expense Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Monthly Supermarket Shopping, Gas Refill"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              step="0.01"
              placeholder="e.g. 150.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            >
              <option value="Groceries">Groceries</option>
              <option value="Utilities">Utilities (Electricity, Water, Gas)</option>
              <option value="Healthcare">Healthcare & Pharmacy</option>
              <option value="Education">Education & Books</option>
              <option value="Shopping">Shopping</option>
              <option value="Dining">Dining Out</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payer</label>
            <input
              type="text"
              required
              value={payer}
              onChange={e => setPayer(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
          <input
            type="text"
            placeholder="e.g. Purchased at Whole Foods"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isPersonal}
            onChange={e => setIsPersonal(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
          />
          <span>🔒 Keep Private (Personal expense - only visible in my account)</span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('expense')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md"
          >
            {editing ? 'Save Changes' : 'Save Expense'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export const BillManagementScreen: React.FC = () => {
  const { bills, markBillPaid, markBillUnpaid, updateBill, deleteBill, setActiveSubScreen, addBill } = useHomeBrain();
  const [showAddBill, setShowAddBill] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    const payload: Omit<BillItem, 'id' | 'isPaid'> = {
      title,
      amount: parseFloat(amount),
      dueDate,
      category: 'Utilities',
      recurring: 'Monthly'
    };
    if (editingId) updateBill(editingId, payload);
    else addBill(payload);

    setShowAddBill(false);
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDueDate('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Household Bill Management Tracker"
        subtitle="Track electricity, water, internet, and recurring bills across billing cycles"
        actions={
          <button
            onClick={() => setShowAddBill(!showAddBill)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> {showAddBill ? 'Close Form' : 'Add Bill'}
          </button>
        }
      />

      {showAddBill && (
        <form onSubmit={handleAddBillSubmit} className="p-4 rounded-3xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Household Bill</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Bill Title (e.g. Internet)"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl">
            Save Bill
          </button>
        </form>
      )}

      <div className="space-y-3">
        {bills.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No bills recorded yet.
          </div>
        )}
        {bills.map(b => (
          <div
            key={b.id}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              b.isPaid
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70'
                : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/60 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{b.title}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.isPaid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {b.isPaid ? 'PAID ✓' : 'UNPAID'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Due Date: <span className="font-semibold">{b.dueDate}</span> • Recurrence: {b.recurring}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-base font-black text-slate-900 dark:text-white">{formatINR(b.amount)}</span>
              <button
                onClick={() => {
                  setEditingId(b.id);
                  setTitle(b.title);
                  setAmount(String(b.amount));
                  setDueDate(b.dueDate);
                  setShowAddBill(true);
                }}
                className="text-xs text-brand-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${b.title}?`)) deleteBill(b.id);
                }}
                className="text-xs text-rose-500 hover:underline"
              >
                Delete
              </button>
              {!b.isPaid ? (
                <button
                  onClick={() => markBillPaid(b.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Mark as Paid
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 font-semibold">Paid by {b.paidBy}</span>
                  <button
                    onClick={() => markBillUnpaid(b.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-amber-600 hover:underline"
                  >
                    Mark unpaid
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
