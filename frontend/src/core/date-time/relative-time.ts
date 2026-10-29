/** Defines the supported relative-time formatting styles. */
export const RelativeTimeStyle = { Long: 'long', Short: 'short', Narrow: 'narrow' } as const;

export type RelativeTimeStyle = (typeof RelativeTimeStyle)[keyof typeof RelativeTimeStyle];

type FormatRelativeTimeOptions = { now: Date; locale?: string; style?: RelativeTimeStyle };

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Selects an appropriate elapsed-time unit.
 * Months and years use approximate durations rather than calendar boundaries.
 */
function getRelativeTimePart(distanceMs: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
    const seconds = Math.round(distanceMs / SECOND_MS);
    if (seconds < 60) return { value: seconds, unit: 'second' };

    const minutes = Math.round(distanceMs / MINUTE_MS);
    if (minutes < 60) return { value: minutes, unit: 'minute' };

    const hours = Math.round(distanceMs / HOUR_MS);
    if (hours < 24) return { value: hours, unit: 'hour' };

    const days = Math.round(distanceMs / DAY_MS);
    if (days < 30) return { value: days, unit: 'day' };

    const months = Math.round(distanceMs / MONTH_MS);
    if (distanceMs < YEAR_MS) return { value: months, unit: 'month' };

    return { value: Math.round(distanceMs / YEAR_MS), unit: 'year' };
}

/**
 * Formats the elapsed time between two instants as a localized relative label.
 * The reference time must be supplied explicitly.
 */
export function formatRelativeTime(
    date: Date,
    { now, locale = 'en-US', style = RelativeTimeStyle.Long }: FormatRelativeTimeOptions,
): string {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        throw new TypeError('Expected a valid date.');
    }

    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
        throw new TypeError('Expected a valid reference time.');
    }

    const differenceMs = date.getTime() - now.getTime();
    const { value, unit } = getRelativeTimePart(Math.abs(differenceMs));

    if (value === 0) {
        return new Intl.RelativeTimeFormat(locale, { style, numeric: 'auto' }).format(0, 'second');
    }

    const formatter = new Intl.RelativeTimeFormat(locale, { style, numeric: 'always' });
    return formatter.format(differenceMs < 0 ? -value : value, unit);
}
