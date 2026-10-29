import { calendarDateSchema, timeOfDaySchema, type CalendarDateString, type TimeOfDayString } from './schemas';

/** Defines the native Intl formatting presets for dates and times. */
export const DateTimeStyle = { Short: 'short', Medium: 'medium', Long: 'long', Full: 'full' } as const;

export type DateTimeStyle = (typeof DateTimeStyle)[keyof typeof DateTimeStyle];

type ZonedFormatOptions = { locale?: string; timeZone: string };

type FormatDateOptions = ZonedFormatOptions & { dateStyle?: DateTimeStyle };

type FormatTimeOptions = ZonedFormatOptions & { timeStyle?: DateTimeStyle; hour12?: boolean };

type FormatDateTimeOptions = FormatDateOptions & FormatTimeOptions;

type FormatCalendarDateOptions = { locale?: string; dateStyle?: DateTimeStyle };

type FormatTimeOfDayOptions = { locale?: string; hour12?: boolean };

const DEFAULT_LOCALE = 'en-US';

/** Ensures the supplied value represents a valid JavaScript Date. */
function assertValidDate(date: Date): void {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        throw new TypeError('Expected a valid JavaScript Date instance.');
    }
}

/** Resolves the requested hour cycle, using 00–23 for 24-hour formatting. */
function getHourFormatOptions(hour12?: boolean): Intl.DateTimeFormatOptions {
    if (hour12 === false) {
        return { hourCycle: 'h23' };
    }

    if (hour12 === true) {
        return { hour12: true };
    }

    return {};
}

/** Formats an instant using an explicit timezone and locale-aware options. */
function formatInstant(
    date: Date,
    { locale = DEFAULT_LOCALE, ...options }: ZonedFormatOptions & Intl.DateTimeFormatOptions,
): string {
    assertValidDate(date);

    if (typeof options.timeZone !== 'string' || options.timeZone.trim().length === 0) {
        throw new TypeError('A valid timeZone is required.');
    }

    return new Intl.DateTimeFormat(locale, options).format(date);
}

/** Formats the calendar date of an instant in the specified timezone. */
export function formatDate(
    date: Date,
    { locale, timeZone, dateStyle = DateTimeStyle.Medium }: FormatDateOptions,
): string {
    return formatInstant(date, { locale, timeZone, dateStyle });
}

/** Formats the clock time of an instant in the specified timezone. */
export function formatTime(
    date: Date,
    { locale, timeZone, timeStyle = DateTimeStyle.Short, hour12 }: FormatTimeOptions,
): string {
    return formatInstant(date, { locale, timeZone, timeStyle, ...getHourFormatOptions(hour12) });
}

/** Formats the calendar date and clock time of an instant in the specified timezone. */
export function formatDateTime(
    date: Date,
    {
        locale,
        timeZone,
        dateStyle = DateTimeStyle.Medium,
        timeStyle = DateTimeStyle.Short,
        hour12,
    }: FormatDateTimeOptions,
): string {
    return formatInstant(date, { locale, timeZone, dateStyle, timeStyle, ...getHourFormatOptions(hour12) });
}

/** Formats a calendar date without applying timezone conversion. */
export function formatCalendarDate(
    value: CalendarDateString,
    { locale = DEFAULT_LOCALE, dateStyle = DateTimeStyle.Medium }: FormatCalendarDateOptions = {},
): string {
    const validated = calendarDateSchema.parse(value);

    const year = Number(validated.slice(0, 4));
    const month = Number(validated.slice(5, 7));
    const day = Number(validated.slice(8, 10));

    const date = new Date(0);

    // Preserve years 0000–0099, which Date.UTC would otherwise interpret as 1900–1999.
    date.setUTCFullYear(year, month - 1, day);

    return new Intl.DateTimeFormat(locale, { dateStyle, timeZone: 'UTC' }).format(date);
}

/** Formats a time-of-day value without applying timezone conversion. */
export function formatTimeOfDay(
    value: TimeOfDayString,
    { locale = DEFAULT_LOCALE, hour12 }: FormatTimeOfDayOptions = {},
): string {
    const validated = timeOfDaySchema.parse(value);

    const hours = Number(validated.slice(0, 2));
    const minutes = Number(validated.slice(3, 5));

    const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));

    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
        ...getHourFormatOptions(hour12),
    }).format(date);
}
