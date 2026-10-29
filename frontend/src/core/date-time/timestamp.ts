import { isoTimestampSchema } from './schemas';

/** Parses a timezone-qualified ISO timestamp into a JavaScript Date representing the same instant. */
export function parseIsoTimestamp(value: string): Date {
    return new Date(isoTimestampSchema.parse(value));
}
