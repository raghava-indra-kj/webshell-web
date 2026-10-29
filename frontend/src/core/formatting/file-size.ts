/** Options for locale-aware file size formatting. */
type FileSizeOptions = { locale?: string; maximumFractionDigits?: number };

const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const;
const DECIMAL_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'] as const;

/** Converts a byte count to the largest supported unit for the given base. */
function scaleFileSize(bytes: number, { base, units }: { base: number; units: readonly string[] }) {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
        throw new RangeError(`Invalid file size: expected a non-negative safe integer, received ${bytes}`);
    }

    let value = bytes;
    let unitIndex = 0;

    while (value >= base && unitIndex < units.length - 1) {
        value /= base;
        unitIndex++;
    }

    return { value, unit: units[unitIndex] };
}

/** Formats a scaled file size with locale-aware precision. */
function formatScaledFileSize(
    size: { value: number; unit: string },
    { locale = 'en-US', maximumFractionDigits = 1 }: FileSizeOptions = {},
): string {
    if (!Number.isInteger(maximumFractionDigits) || maximumFractionDigits < 0 || maximumFractionDigits > 20) {
        throw new RangeError(
            `Invalid maximumFractionDigits: expected an integer between 0 and 20, received ${maximumFractionDigits}`,
        );
    }

    const formatted = new Intl.NumberFormat(locale, {
        maximumFractionDigits: size.unit === 'B' ? 0 : maximumFractionDigits,
    }).format(size.value);

    return `${formatted} ${size.unit}`;
}

/** Formats a byte count using binary (1024-based) units such as KiB and MiB. */
export function formatBinaryFileSize(bytes: number, options: FileSizeOptions = {}): string {
    return formatScaledFileSize(scaleFileSize(bytes, { base: 1024, units: BINARY_UNITS }), options);
}

/** Formats a byte count using decimal (1000-based) units such as kB and MB. */
export function formatDecimalFileSize(bytes: number, options: FileSizeOptions = {}): string {
    return formatScaledFileSize(scaleFileSize(bytes, { base: 1000, units: DECIMAL_UNITS }), options);
}
