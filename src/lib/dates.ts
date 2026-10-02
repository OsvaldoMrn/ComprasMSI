export function getLocalDateISO(date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatDateInput(value: string): string {
	const isoMatch = value.match(/^(\d{4})[- ](\d{2})[- ](\d{2})$/);
	if (isoMatch) return `${isoMatch[3]} ${isoMatch[2]} ${isoMatch[1]}`;

	const digits = value.replace(/\D/g, '').slice(0, 8);
	if (digits.length <= 2) return digits;
	if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
	return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
}

export function formatDateForInput(value: string): string {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	return match ? `${match[3]} ${match[2]} ${match[1]}` : formatDateInput(value);
}

export function parseDateInputToISO(value: string): string {
	const isoMatch = value.match(/^(\d{4})[- ](\d{2})[- ](\d{2})$/);
	if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

	const digits = value.replace(/\D/g, '').slice(0, 8);
	if (digits.length !== 8) return value;
	return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}
