export const formatIndiaDateTime = (value: string): string => {
  const legacyMatch = value.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) [–-] (\d{1,2}):(\d{2}) ([AP]M)$/);
  const normalizedValue = legacyMatch
    ? `${legacyMatch[1]} ${legacyMatch[2]} ${legacyMatch[3]} ${legacyMatch[4]}:${legacyMatch[5]} ${legacyMatch[6]}`
    : value;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return `${get('day')} ${get('month')} ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`;
};

export const formatINR = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
