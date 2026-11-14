import React, { useState } from 'react';
import { useHomeBrain } from '../../context/HomeBrainContext';
import { formatIndiaDateTime } from '../../lib/display';
import { GroceryCategory } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { ShoppingCart, Plus, CheckCircle2, Circle, Clock, User, History, Sparkles, X } from 'lucide-react';

export const GroceryCard: React.FC = () => {
  const { groceries, toggleGroceryPurchased, navigateToSubScreen } = useHomeBrain();
  const pending = groceries.filter(g => !g.isPurchased);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Smart Grocery List</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{pending.length} Items Needed</p>
            </div>
          </div>
          <button
            onClick={() => navigateToSubScreen('grocery')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="space-y-2 mt-4">
          {groceries.slice(0, 3).map(item => (
            <div
              key={item.id}
              onClick={() => toggleGroceryPurchased(item.id)}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                {item.isPurchased ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      item.isPurchased ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {item.name}
                  </p>
                  {item.isPurchased && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Bought by {item.purchasedBy} on {item.purchasedAt ? formatIndiaDateTime(item.purchasedAt) : 'date unavailable'}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigateToSubScreen('add-grocery')}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-4 h-4" /> Quick Add Item
      </button>
    </div>
  );
};

export const GroceryListScreen: React.FC = () => {
  const { groceries, toggleGroceryPurchased, navigateToSubScreen, setActiveSubScreen, deleteGroceryItem } = useHomeBrain();
  const [activeTab, setActiveTab] = useState<'pending' | 'purchased'>('pending');

  const pendingItems = groceries.filter(g => !g.isPurchased);
  const purchasedItems = groceries.filter(g => g.isPurchased);

  const currentList = activeTab === 'pending' ? pendingItems : purchasedItems;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Shared Family Grocery List"
        subtitle="Real-time grocery list preventing duplicate purchases across family members"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToSubScreen('grocery-history')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm"
            >
              <History className="w-4 h-4 text-emerald-500" /> Purchase History
            </button>
            <button
              onClick={() => navigateToSubScreen('add-grocery')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        }
      />

      {/* Progress & Pantry Fulfillment Gauge */}
      {groceries.length > 0 && (
        <div className="spatial-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Pantry Fulfillment Progress</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {Math.round((purchasedItems.length / groceries.length) * 100)}% Fulfilled
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(purchasedItems.length / groceries.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0 font-medium text-slate-500 dark:text-slate-400">
            <span>Pending: <strong className="text-amber-500 font-bold">{pendingItems.length}</strong></span>
            <span>Purchased: <strong className="text-emerald-500 font-bold">{purchasedItems.length}</strong></span>
            <span>Total: <strong className="text-slate-800 dark:text-white font-bold">{groceries.length}</strong></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Items ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('purchased')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'purchased'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Recently Purchased ({purchasedItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === 'pending' ? 'Your grocery list is empty. Add your first item!' : 'No recent purchases recorded.'}
            </p>
          </div>
        ) : (
          currentList.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => toggleGroceryPurchased(item.id)}
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {item.isPurchased ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        item.isPurchased ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.name}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.quantity}
                    </span>
                  </div>

                  {item.isPurchased ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      ✓ Bought by <span className="font-bold">{item.purchasedBy}</span> on {item.purchasedAt ? formatIndiaDateTime(item.purchasedAt) : 'date unavailable'}
                    </p>
                  ) : (
                    item.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.category}</span>
                <button
                  onClick={() => navigateToSubScreen('edit-grocery', item.id)}
                  className="text-xs text-brand-600 hover:underline ml-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${item.name}?`)) deleteGroceryItem(item.id);
                  }}
                  className="text-xs text-rose-500 hover:underline ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AddGroceryModal: React.FC = () => {
  const { addGroceryItem, updateGroceryItem, groceries, selectedItemId, activeSubScreen, setActiveSubScreen } = useHomeBrain();
  const existing = groceries.find(item => item.id === selectedItemId);
  const editing = activeSubScreen === 'edit-grocery' && Boolean(existing);
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState<GroceryCategory>(existing?.category || 'Dairy');
  const [quantity, setQuantity] = useState(existing?.quantity || '1 Pack');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing && existing) updateGroceryItem(existing.id, { name, category, quantity, notes });
    else addGroceryItem({ name, category, quantity, notes });
    setActiveSubScreen('grocery');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title={editing ? 'Edit Grocery Requirement' : 'Add Grocery Requirement'}
        subtitle="Specify item, pantry category, and package quantities"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Organic Milk, Whole Wheat Bread, Eggs"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as GroceryCategory)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            >
              <option value="Dairy">Dairy & Milk</option>
              <option value="Produce">Fruits & Veggies</option>
              <option value="Bakery">Bakery & Bread</option>
              <option value="Pantry">Pantry Staples</option>
              <option value="Meat">Meat & Seafood</option>
              <option value="Household">Household Goods</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
            <input
              type="text"
              required
              placeholder="e.g. 2 Liters / 1 Pack"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Optional Notes</label>
          <input
            type="text"
            placeholder="e.g. Low fat 2% only for Grandma"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveSubScreen('grocery')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md"
          >
            {editing ? 'Save Changes' : 'Add to List'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export const GroceryHistoryScreen: React.FC = () => {
  const { groceryHistory, setActiveSubScreen } = useHomeBrain();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Grocery Purchase History Log"
        subtitle="Auditable record of fulfilled items, buyers, and transaction timestamps"
        showBack={true}
      />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700 space-y-3">
        {groceryHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">No purchase history recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Purchased items will automatically log here with timestamps and buyer details.</p>
          </div>
        ) : (
          groceryHistory.map(hist => (
          <div
            key={hist.id}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{hist.name}</p>
              <p className="text-slate-500 text-[11px]">Category: {hist.category}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Bought by {hist.purchasedBy}</p>
              <p className="text-[10px] text-slate-400">{formatIndiaDateTime(hist.purchasedAt)}</p>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};
