import { z } from 'zod';

export const SCHEDULE_STORAGE_KEY = 'afriwage:payment-schedules';
export const SCHEDULES_UPDATED_EVENT = 'afriwage:schedules-updated';

export const scheduleFrequencySchema = z.enum(['weekly', 'monthly']);
const isoDateSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid ISO date');

const scheduleSchema = z.object({
  id: z.string().min(1),
  recipientAddress: z.string().min(1),
  amount: z.string().min(1),
  memo: z.string(),
  frequency: scheduleFrequencySchema,
  nextPaymentDate: isoDateSchema,
  createdAt: isoDateSchema,
});

const scheduleListSchema = z.array(scheduleSchema);

export type ScheduleFrequency = z.infer<typeof scheduleFrequencySchema>;
export type Schedule = z.infer<typeof scheduleSchema>;

export interface CreateScheduleInput {
  recipientAddress: string;
  amount: string;
  memo: string;
  frequency: ScheduleFrequency;
  nextPaymentDate: string;
}

const sortSchedules = (schedules: Schedule[]): Schedule[] =>
  [...schedules].sort(
    (left, right) => new Date(left.nextPaymentDate).getTime() - new Date(right.nextPaymentDate).getTime()
  );

const getRandomId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const readSchedules = (): Schedule[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return sortSchedules(scheduleListSchema.parse(JSON.parse(raw)));
  } catch {
    window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    return [];
  }
};

const writeSchedules = (schedules: Schedule[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(sortSchedules(schedules)));
  window.dispatchEvent(new Event(SCHEDULES_UPDATED_EVENT));
};

export function calculateNextPaymentDate(
  frequency: ScheduleFrequency,
  baseDate: Date = new Date()
): string {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + (frequency === 'weekly' ? 7 : 30));
  return nextDate.toISOString();
}

export function getSchedules(): Schedule[] {
  return readSchedules();
}

export function createSchedule(input: CreateScheduleInput): Schedule {
  const schedule: Schedule = {
    id: getRandomId(),
    recipientAddress: input.recipientAddress.trim(),
    amount: input.amount.trim(),
    memo: input.memo.trim(),
    frequency: input.frequency,
    nextPaymentDate: input.nextPaymentDate,
    createdAt: new Date().toISOString(),
  };

  const parsed = scheduleSchema.parse(schedule);
  const schedules = sortSchedules([...readSchedules(), parsed]);
  writeSchedules(schedules);
  return parsed;
}

export function deleteSchedule(id: string): void {
  const schedules = readSchedules().filter((schedule) => schedule.id !== id);
  writeSchedules(schedules);
}

export function updateNextPaymentDate(id: string, nextPaymentDate: string): Schedule | null {
  const schedules = readSchedules();
  const index = schedules.findIndex((schedule) => schedule.id === id);
  if (index === -1) {
    return null;
  }

  const updated = scheduleSchema.parse({
    ...schedules[index],
    nextPaymentDate,
  });

  schedules[index] = updated;
  writeSchedules(schedules);
  return updated;
}

export function getScheduleById(id: string): Schedule | null {
  return readSchedules().find((schedule) => schedule.id === id) ?? null;
}

export function isScheduleDue(schedule: Schedule, referenceDate: Date = new Date()): boolean {
  const dueBy = new Date(schedule.nextPaymentDate);
  const endOfDay = new Date(referenceDate);
  endOfDay.setHours(23, 59, 59, 999);
  return dueBy.getTime() <= endOfDay.getTime();
}

export function getDueSchedules(referenceDate: Date = new Date()): Schedule[] {
  return readSchedules().filter((schedule) => isScheduleDue(schedule, referenceDate));
}
