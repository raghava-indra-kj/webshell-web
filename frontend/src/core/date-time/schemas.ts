import { z } from 'zod';

/** Validates a calendar date without time or timezone information (YYYY-MM-DD). */
export const calendarDateSchema = z.iso.date().brand<'CalendarDate'>();

export type CalendarDateString = z.infer<typeof calendarDateSchema>;

/** Validates a time of day at minute precision (HH:mm). */
export const timeOfDaySchema = z.iso.time({ precision: -1 }).brand<'TimeOfDay'>();

export type TimeOfDayString = z.infer<typeof timeOfDaySchema>;

/** Validates a timezone-qualified ISO timestamp representable as a JavaScript Date. */
export const isoTimestampSchema = z.iso
    .datetime({ offset: true })
    .refine((value) => Number.isFinite(Date.parse(value)), {
        error: 'Timestamp cannot be represented as a JavaScript Date',
    })
    .brand<'IsoTimestamp'>();

export type IsoTimestampString = z.infer<typeof isoTimestampSchema>;
