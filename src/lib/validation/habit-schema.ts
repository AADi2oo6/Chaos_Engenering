import { z } from 'zod';

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional().nullable(),
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category must be 50 characters or less').default('General'),
  target_value: z.number().positive('Target value must be greater than 0'),
  target_unit: z.string().trim().min(1, 'Unit is required').max(50, 'Unit must be 50 characters or less'),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  reminder_time: z.string().optional().nullable(),
});

export const habitUpdateSchema = habitCreateSchema.partial();

export const habitLogSchema = z.object({
  habit_id: z.string().uuid('Invalid habit ID'),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  actual_value: z.number().nonnegative('Actual value cannot be negative'),
  source: z.enum(['manual', 'telegram', 'ai', 'iot', 'reader']).default('manual'),
  notes: z.string().max(500).optional().nullable(),
});

export const recoveryLogSchema = z.object({
  habit_id: z.string().uuid('Invalid habit ID'),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type HabitCreateInput = z.infer<typeof habitCreateSchema>;
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>;
export type HabitLogInput = z.infer<typeof habitLogSchema>;
