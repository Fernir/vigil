import {
  formatDate,
  formatTime,
  formatDateTime,
  formatOnlyDate,
} from "~/utils/date";

export const useDate = () => {
  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatOnlyDate,
  };
};
