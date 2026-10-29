type CurrencyFormatOptions = {
    currency: string;
    locale?: string;
    currencyDisplay?: Intl.NumberFormatOptions['currencyDisplay'];
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};

/** Formats a monetary amount using the specified currency and locale. */
export function formatCurrency(amount: number, options: CurrencyFormatOptions): string {
    if (!Number.isFinite(amount)) {
        throw new RangeError(`Invalid amount: expected a finite number, received ${String(amount)}`);
    }

    const {
        currency,
        locale = 'en-US',
        currencyDisplay = 'symbol',
        minimumFractionDigits,
        maximumFractionDigits,
    } = options;

    if (typeof currency !== 'string' || currency.trim().length === 0) {
        throw new TypeError('A valid currency code is required.');
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(amount);
}
