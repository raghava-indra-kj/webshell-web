type NumericFormatOptions = { locale?: string; minimumFractionDigits?: number; maximumFractionDigits?: number };

type FormatNumberOptions = NumericFormatOptions & { useGrouping?: boolean };

/** Ensures the supplied numeric value is finite. */
function assertFiniteNumber(value: number): void {
    if (!Number.isFinite(value)) {
        throw new RangeError(`Invalid number: expected a finite number, received ${String(value)}`);
    }
}

/** Formats a number with locale-aware grouping and decimal precision. */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
    assertFiniteNumber(value);

    const { locale = 'en-US', minimumFractionDigits, maximumFractionDigits, useGrouping } = options;

    return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits, useGrouping }).format(value);
}

/** Formats a ratio as a percentage, where 0.25 represents 25%. */
export function formatRatioAsPercent(ratio: number, options: NumericFormatOptions = {}): string {
    assertFiniteNumber(ratio);

    const { locale = 'en-US', minimumFractionDigits, maximumFractionDigits } = options;

    return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits, maximumFractionDigits }).format(
        ratio,
    );
}
