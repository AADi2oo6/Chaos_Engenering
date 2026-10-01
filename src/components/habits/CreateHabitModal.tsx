'use client';

import React, { useState } from 'react';
import { X, Loader2, Sparkles, Plus } from 'lucide-react';
import { HabitCreateInput } from '@/lib/validation/habit-schema';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: HabitCreateInput) => Promise<void>;
}

const PRESETS = [
  { name: 'Reading', category: 'Learning', target_value: 10, target_unit: 'pages', icon: '📖' },
  { name: 'Walking', category: 'Fitness', target_value: 5000, target_unit: 'steps', icon: '🚶' },
  { name: 'Study', category: 'Focus', target_value: 60, target_unit: 'minutes', icon: '📚' },
  { name: 'Drink Water', category: 'Health', target_value: 2, target_unit: 'litres', icon: '💧' },
  { name: 'No Sugar', category: 'Health', target_value: 1, target_unit: 'day', icon: '🍬' },
];

export function CreateHabitModal({ isOpen, onClose, onCreate }: CreateHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Learning');
  const [targetValue, setTargetValue] = useState<string>('10');
  const [targetUnit, setTargetUnit] = useState('pages');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setTargetValue(String(preset.target_value));
    setTargetUnit(preset.target_unit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) {
      setError('Target value must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        name,
        description: description || null,
        category,
        target_value: val,
        target_unit: targetUnit,
        frequency: 'daily',
        reminder_time: reminderTime || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create New Habit</h2>
              <p className="text-xs text-slate-400">Set daily target and commit to consistency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" /> Quick-Start Templates
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-xs text-slate-300 transition-all flex items-center gap-1.5"
              >
                <span>{p.icon}</span>
                <span>{p.name} ({p.target_value} {p.target_unit})</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Habit Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading, Walking, Study..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Read atomic habits or non-fiction before bed"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Daily Target *</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit *</label>
              <input
                type="text"
                required
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                placeholder="pages, steps, minutes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Learning">Learning</option>
                <option value="Fitness">Fitness</option>
                <option value="Health">Health</option>
                <option value="Focus">Focus</option>
                <option value="Mindset">Mindset</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
