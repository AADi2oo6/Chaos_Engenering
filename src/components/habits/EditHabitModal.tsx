'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { Habit } from '@/types/habit';
import { HabitUpdateInput } from '@/lib/validation/habit-schema';

interface EditHabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, input: HabitUpdateInput) => Promise<void>;
}

export function EditHabitModal({ habit, isOpen, onClose, onUpdate }: EditHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LEARNING');
  const [targetValue, setTargetValue] = useState<string>('10');
  const [targetUnit, setTargetUnit] = useState('PAGES');
  const [reminderTime, setReminderTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setCategory(habit.category);
      setTargetValue(String(habit.target_value));
      setTargetUnit(habit.target_unit);
      setReminderTime(habit.reminder_time || '');
    }
  }, [habit]);

  if (!isOpen || !habit) return null;

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
      await onUpdate(habit.id, {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim(),
        target_value: val,
        target_unit: targetUnit.trim(),
        reminder_time: reminderTime || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'FAILED TO UPDATE CONFIGURATION');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="w-full max-w-lg bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_#09090b] space-y-5 font-mono text-xs">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-black" />
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              RECONFIGURE HABIT // {habit.name.toUpperCase()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* System Notice */}
        <div className="p-3 border-2 border-black bg-zinc-100 flex items-start gap-2 text-zinc-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-black" />
          <p className="font-bold">
            TARGET REVISION APPLIES PROSPECTIVELY. ALL HISTORICAL LOGS, STREAKS, AND TELEMETRY REMAIN INTACT.
          </p>
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
              className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none focus:border-[#ea580c]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-black mb-1">
              DESCRIPTION
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              COMMIT REVISION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
