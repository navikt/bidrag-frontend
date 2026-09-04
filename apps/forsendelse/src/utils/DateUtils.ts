export function toDateObject(dateString?: string): Date | undefined {
    if (!dateString) return;
    const dateParts = dateString?.split(".");
    if (dateParts.length !== 3) return;

    // month is 0-based, that's why we need dataParts[1] - 1
    return new Date(+dateParts[2], parseInt(dateParts[1], 10) - 1, +dateParts[0]);
}
export function toISOString(date?: Date): string {
    if (!date) return;

    // month is 0-based, that's why we need dataParts[1] - 1
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString();
}
