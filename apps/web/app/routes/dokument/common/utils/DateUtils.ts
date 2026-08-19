import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { isEmpty } from "./ObjectUtils";

dayjs.extend(customParseFormat);

const DATE_FORMATS = ["DDMMYY", "DD.MM.YYYY", "YYYY-MM-DD"];
export const isValidDate = (date: string, formats: string[] | string = DATE_FORMATS) => {
    if (isEmpty(date)) {
        return true;
    }

    return dayjs(date, formats, true).isValid();
};

export const isFutureDate = (date: string) => {
    if (!isValidDate(date, DATE_FORMATS)) {
        return false;
    }
    return dayjs(date, DATE_FORMATS, true).isAfter(dayjs(new Date()), "days");
};

export const isAfterDate = (date: string, maxValidDate: string) => {
    if (!isValidDate(date, DATE_FORMATS)) {
        return false;
    }
    return dayjs(date, DATE_FORMATS, true).isAfter(dayjs(maxValidDate, "YYYY-MM-DD"), "days");
};

export const formatDate = (date: string, format = "DD.MM.YYYY") => {
    if (isValidDate(date, DATE_FORMATS) && !isEmpty(date)) {
        return dayjs(date, DATE_FORMATS, true).format(format);
    }
    return date;
};
export const dateOrNull = (dateString?: string): Date | null => (dateString ? new Date(dateString) : null);
export const parseDateFromDDMMYYYY = (dateString: string): Date => {
    const dateJs = dayjs(dateString, DATE_FORMATS, true);
    if (dateJs.isValid()) {
        return dateJs.toDate();
    }
    if (dateString.includes("-")) {
        const [day, month, year] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    } else if (dateString.includes(".")) {
        const [day, month, year] = dateString.split(".").map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(
        parseInt(dateString.slice(0, 1)),
        parseInt(dateString.slice(1, 2)) - 1,
        parseInt(dateString.slice(2, 3))
    );
};
