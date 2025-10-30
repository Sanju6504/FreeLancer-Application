// Currency utility functions for Indian Rupees (INR)

export function formatINR(amount, showSymbol = true) {
  if (amount == null || Number.isNaN(amount)) return '';
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  if (!showSymbol) return formatted.replace('₹', '').trim();
  return formatted;
}

export function formatINRCompact(amount, showSymbol = true) {
  if (amount == null || Number.isNaN(amount)) return '';
  const symbol = showSymbol ? '₹' : '';
  if (amount >= 10000000) {
    return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`;
}

export function formatHourlyRate(rate) {
  if (rate == null || Number.isNaN(rate)) return '';
  return `${formatINR(rate)}/hr`;
}

export function formatBudgetRange(min, max) {
  if (min == null && max == null) return '';
  if (min != null && max != null) {
    if (min === max) return formatINR(min);
    return `${formatINR(min)} - ${formatINR(max)}`;
  }
  if (min != null) return `${formatINR(min)}+`;
  return `${formatINR(max)}`;
}

export function convertUSDToINR(usdAmount) {
  if (usdAmount == null || Number.isNaN(usdAmount)) return 0;
  const exchangeRate = 83; // Approximate USD to INR rate
  return Math.round(usdAmount * exchangeRate);
}

export function parseCurrency(currencyString) {
  if (typeof currencyString !== 'string') return 0;
  const numericString = currencyString.replace(/[₹$,+\s]/g, '').replace(/,/g, '');
  const parsed = parseFloat(numericString);
  return Number.isNaN(parsed) ? 0 : parsed;
}
