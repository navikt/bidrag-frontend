import { StringUtils } from "@bidrag/common";

export const dateOrNull = (dateString?: string): Date | null => (dateString ? new Date(dateString) : null);
export const toISODateString = (date?: Date): string | null =>
    date?.toLocaleDateString("sv-SV", { year: "numeric", month: "2-digit", day: "2-digit" }) ?? null;
export const toISODateTimeString = (date?: Date): string | null =>
    date === undefined
        ? null
        : date?.toLocaleDateString("sv-SV", { year: "numeric", month: "2-digit", day: "2-digit" }) +
          "T" +
          date?.toLocaleTimeString() +
          "Z";
export const addDays = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
};

export const deductDays = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - days);
    return newDate;
};

export const addMonths = (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
};

export const addMonthsIgnoreDay = (date: Date, months: number) => {
    // If the day of the month is higher month of the next month the month will end up being two months ahead
    // Ex if date is 31.01.2021 and we add 1 month then the resulting date will be 03.03.2021 because february ends at 28.02.2021
    // Thats why we set the day to first day before adding the months
    const newDate = firstDayOfMonth(new Date(date));
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
};

export const deductMonths = (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
};

export const deductMonthsIgnoreday = (date: Date, months: number) => {
    const newDate = firstDayOfMonth(new Date(date));
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
};

export const lastDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
export const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const isValidDate = (date: unknown | Date): boolean =>
    !!(date && date instanceof Date && isFinite(date.getTime()));

export const toDateString = (date: Date) => date.toLocaleDateString("no-NO", { dateStyle: "short" });

export const DDMMYYYYStringToDate = (dateString: string) => {
    const [day, month, year] = dateString.split(".").map((d, i) => {
        if (i === 1) return Number(d) - 1;
        if (i === 2) return Number(d);
        return Number(d);
    });

    return new Date(year, month, day);
};

export const DateToDDMMYYYYString = (date: Date) =>
    date?.toLocaleDateString("nb-NO", { year: "numeric", month: "2-digit", day: "2-digit" });

export const DateToDDMMYYYYHHMMString = (date: Date) =>
    date?.toLocaleDateString("nb-NO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

export const DateToMMYYYYString = (date: Date) =>
    date?.toLocaleDateString("nb-NO", { year: "numeric", month: "2-digit" });

export const ISODateTimeStringToDDMMYYYYString = (isoDateTimeString: string) => {
    const date = new Date(isoDateTimeString);
    return isValidDate(date) ? DateToDDMMYYYYString(date) : "";
};

export const isFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDate() === date.getDate();
};

export const isLastDayOfMonth = (date: Date) => {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay.getDate() === date.getDate();
};

export const datesAreFromSameMonthAndYear = (date: Date, testDate: Date) =>
    date.getMonth() === testDate.getMonth() && date.getFullYear() === testDate.getFullYear();

export const getAListOfMonthsFromDate = (fromDate: Date, numberOfMonths: number): Date[] => {
    const months = [];
    for (let i = 0; i <= numberOfMonths - 1; i++) {
        months.push(addMonths(firstDayOfMonth(fromDate), i));
    }
    return months;
};

export const periodCoversMinOneFullCalendarMonth = (startDate: Date, endDate: Date) => {
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    const endDateIsLastDayOfMonth = isLastDayOfMonth(endDate);

    if (yearsDiff === 0) {
        if (isFirstDayOfMonth(startDate) && endDateIsLastDayOfMonth) return true;

        return monthDiff >= (endDateIsLastDayOfMonth ? 1 : 2);
    }

    return endDateIsLastDayOfMonth || monthDiff + 12 > 1;
};

export const maxOfDate = (date: Date | string, comparedWith: Date | string) => {
    return isAfterDate(date, comparedWith) ? date : comparedWith;
};
export const isAfterDate = (date: Date | string, comparedWith: Date | string = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0);
    const c = new Date(comparedWith);
    c.setHours(0, 0, 0);

    return d.getTime() > c.getTime();
};
export const isAfterEqualsDate = (date: Date | string, comparedWith: Date | string = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0);
    const c = new Date(comparedWith);
    c.setHours(0, 0, 0);

    return d.getTime() >= c.getTime();
};
export const isBeforeDate = (date: Date | string, comparedWith: Date | string = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0);
    const c = new Date(comparedWith);
    c.setHours(0, 0, 0);

    return d.getTime() < c.getTime();
};

export const isBeforeOrEqualsDate = (date: Date | string, comparedWith: Date | string = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0);
    const c = new Date(comparedWith);
    c.setHours(0, 0, 0);

    return d.getTime() <= c.getTime();
};
export const getYearFromDate = (date?: Date | string): number | undefined => {
    if (!date) return;
    if (typeof date == "string") return new Date(date).getFullYear();
    return date.getFullYear();
};
export const dateToMMYYYY = (date?: Date | string): string | undefined => {
    if (!date) return;
    if (typeof date == "string")
        return new Date(date).toLocaleDateString("nb-NB", { month: "2-digit", year: "numeric" });
    return date.toLocaleDateString("nb-NB", { month: "2-digit", year: "numeric" });
};
export function minOfDates(date1: Date, date2: Date) {
    return isAfterDate(date1, date2) ? date2 : date1;
}

export function formatDateToYearMonth(dateString?: string): string {
    if (StringUtils.isEmpty(dateString)) return dateString;
    // Ensure the input date string is in the expected format (basic validation)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error("Invalid date format. Expected yyyy-MM-dd.");
    }

    // Extract the year and month parts of the date string
    const year = dateString.substring(0, 4);
    const month = dateString.substring(5, 7);

    // Combine and return the year and month in yyyy-MM format
    return `${year}-${month}`;
}
export const getStartOfCurrentMonth = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};
export const getStartOfNextMonth = (): Date => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
};

export const calculateAge = (dateOfBirth: Date | string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    let age = today.getFullYear() - birthDate.getFullYear();

    // Check if the birthday has occurred this year
    const hasBirthdayOccurred =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    // If the birthday hasn't occurred yet, subtract 1 from the age
    if (!hasBirthdayOccurred) {
        age--;
    }

    return age;
};
