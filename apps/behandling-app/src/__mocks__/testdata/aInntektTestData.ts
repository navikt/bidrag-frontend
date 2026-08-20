export interface AndreInntekter {
    aar: string;
    beloep: number;
    tekniskNavn: string;
}
export const createAInntektData = (): AndreInntekter[] => {
    return [
        {
            aar: "2019",
            beloep: 103,
            tekniskNavn: "kapitalinntekt",
        },
        {
            aar: "2021",
            beloep: 6060,
            tekniskNavn: "kapitalinntekt",
        },
    ];
};
