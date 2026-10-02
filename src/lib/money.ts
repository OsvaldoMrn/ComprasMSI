export function formatMoney(amountMinor: number): string {
	return `$${(amountMinor / 100).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} MXN`;
}
