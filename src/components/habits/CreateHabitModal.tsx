'use client';

import React, { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { HabitCreateInput } from '@/lib/validation/habit-schema';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: HabitCreateInput) => Promise<void>;
}

const PRESETS = [
  { name: 'READING', category: 'LEARNING', target_value: 10, target_unit: 'PAGES' },
  { name: 'WALKING', category: 'FITNESS', target_value: 5000, target_unit: 'STEPS' },
  { name: 'STUDY', category: 'FOCUS', target_value: 60, target_unit: 'MINUTES' },
  { name: 'WATER', category: 'HEALTH', target_value: 2, target_unit: 'LITRES' },
  { name: 'NO SUGAR', category: 'HEALTH', target_value: 1, target_unit: 'DAY' },
];

export function CreateHabitModal({ isOpen, onClose, onCreate }: CreateHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LEARNING');
  const [targetValue, setTargetValue] = useState<string>('10');
  const [targetUnit, setTargetUnit] = useState('PAGES');
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
      setError('TARGET VALUE MUST BE POSITIVE');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim(),
        target_value: val,
        target_unit: targetUnit.trim(),
        frequency: 'daily',
        reminder_time: reminderTime || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAILED TO INITIALIZE HABIT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="w-full max-w-lg bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_#09090b] space-y-5 max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Modal Title Bar */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-black" />
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              INITIALIZE NEW HABIT PROTOCOL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="font-bold text-zinc-600 uppercase">
            [ SYSTEM TEMPLATES ]
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1.5 border-2 border-black bg-zinc-50 hover:bg-[#ea580c] hover:text-black font-bold uppercase transition-all shadow-[2px_2px_0px_0px_#09090b]"
              >
                {p.name} ({p.target_value} {p.target_unit})
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 border-2 border-black bg-red-50 text-[#dc2626] font-bold uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold uppercase text-black mb-1">
              HABIT NAME *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. READING, WALKING, STUDY..."
              className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-black mb-1">
              DESCRIPTION / OBJECTIVE (OPTIONAL)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. READ NON-FICTION CHAPTER BEFORE SLEEP"
              className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-black mb-1">
                DAILY TARGET *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-black mb-1">
                UNIT *
              </label>
              <input
                type="text"
                required
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                placeholder="PAGES, STEPS, MINS..."
                className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-black mb-1">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
              >
                <option value="LEARNING">LEARNING</option>
                <option value="FITNESS">FITNESS</option>
                <option value="HEALTH">HEALTH</option>
                <option value="FOCUS">FOCUS</option>
                <option value="MINDSET">MINDSET</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-black mb-1">
                REMINDER TIME
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="btn-brutal-secondary"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-brutal-primary"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 inline" />
              ) : null}
              DEPLOY HABIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
