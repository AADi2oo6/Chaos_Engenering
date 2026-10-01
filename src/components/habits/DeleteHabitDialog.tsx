'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Habit } from '@/types/habit';

interface DeleteHabitDialogProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteHabitDialog({
  habit,
  isOpen,
  onClose,
  onConfirm,
}: DeleteHabitDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !habit) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(habit.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="w-full max-w-md bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_#09090b] space-y-5 font-mono text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 border-2 border-black bg-red-100 text-[#dc2626]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-tight text-black">
              DEACTIVATE HABIT?
            </h3>
            <div className="text-sm font-black text-[#dc2626] uppercase mt-1">
              // {habit.name.toUpperCase()}
            </div>
            <p className="text-zinc-600 mt-2 font-sans font-medium text-xs leading-relaxed">
              This will remove the habit from your active operations dashboard. Historical logs, streak telemetry, and score data remain safely preserved in the database.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="btn-brutal-secondary"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="btn-brutal-danger"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 inline" />
            ) : null}
            CONFIRM DELETION
          </button>
        </div>
      </div>
    </div>
  );
}
