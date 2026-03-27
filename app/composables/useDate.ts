import { formatDate, formatTime, formatDateTime } from '~/utils/date';

export const useDate = () => {
  return {
    formatDate,
    formatTime,
    formatDateTime,
  };
};
