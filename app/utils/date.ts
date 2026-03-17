/**
 * Безопасное форматирование даты
 * @param dateString - строка с датой или undefined
 * @param options - опции форматирования
 * @returns отформатированная дата или 'Never'
 */
export const formatDate = (
  dateString: string | undefined | null,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  if (!dateString) return "Never";

  try {
    const date = new Date(dateString);
    // Проверяем, что дата валидная
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString(undefined, options);
  } catch {
    return "Invalid date";
  }
};

/**
 * Форматирование времени (часы:минуты)
 */
export const formatTime = (dateString: string | undefined | null): string => {
  return formatDate(dateString, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Форматирование даты и времени
 */
export const formatDateTime = (
  dateString: string | undefined | null,
): string => {
  return formatDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Форматирование только даты
 */
export const formatOnlyDate = (
  dateString: string | undefined | null,
): string => {
  return formatDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
