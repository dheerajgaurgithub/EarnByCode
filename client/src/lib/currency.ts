// Centralized INR currency formatting utilities
// Always use INR with en-IN locale across the app

export const INR_CODE = 'INR';
export const INR_LOCALE = 'en-IN';

// Format full currency with two decimals, e.g., ₹1,234.50
export function formatInr(amount: number): string {
  try {
    return new Intl.NumberFormat(INR_LOCALE, {
      style: 'currency',
      currency: INR_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    // Fallback
    return `₹${(Number(amount) || 0).toFixed(2)}`;
  }
}

// Format decimal/grouping without currency symbol (useful for ranges), e.g., 1,20,000
export function formatInrNumber(amount: number): string {
  try {
    return new Intl.NumberFormat(INR_LOCALE, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return String(Number(amount) || 0);
  }
}

export function getInrSymbol(): string {
  try {
    const parts = new Intl.NumberFormat(INR_LOCALE, {
      style: 'currency',
      currency: INR_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const p = parts.find((x) => x.type === 'currency');
    return p?.value || '₹';
  } catch {
    return '₹';
  }
}

// Helper to add +/- sign based on transaction type
export function formatSignedInr(type: string, amount: number): string {
  const debitTypes = ['withdrawal', 'contest_entry', 'purchase'];
  const sign = debitTypes.includes(type) ? '-' : '+';
  return `${sign}${formatInr(Math.abs(Number(amount) || 0))}`;
}
