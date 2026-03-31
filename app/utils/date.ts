/**
 * Safe date formatting of date and time in a fixed format DD.MM.YYYY HH:MM:SS
 * @param dateString - string with date or undefined/null
 * @returns formatted date or 'Never'
 */
const validateDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  const d = validateDate(dateString);
  if (!d) return dateString ? 'Invalid date' : 'Never';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
};

// If need only time
export const formatTime = (dateString: string | undefined | null): string => {
  const d = validateDate(dateString);
  if (!d) return dateString ? 'Invalid date' : 'Never';

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// If need only date
export const formatDate = (dateString: string | undefined | null): string => {
  const d = validateDate(dateString);
  if (!d) return dateString ? 'Invalid date' : 'Never';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};
