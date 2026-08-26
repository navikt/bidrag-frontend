export const sortInAlphabeticOrder = (a: string, b: string) => {
    const stringA = a.toLowerCase();
    const stringB = b.toLowerCase();
    if (stringA < stringB) {
        return -1;
    }
    if (stringA > stringB) {
        return 1;
    }
    return 0;
};
