export const uniqueByKey = <T>(array: T[], key: string): T[] => {
    if (!key) {
        return array;
    }

    return [...new Map(array.filter(Boolean).map((item) => [item[key], item])).values()];
};

export const hasValue = <T>(array: T[], key: string): boolean => {
    return array.some((item) => item === key);
};
