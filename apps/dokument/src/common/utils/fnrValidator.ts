export default function validateFnr(value: string) {
    const elevenDigits = /^\d{11}$/;
    return elevenDigits.test(value) && parseInt(value.substring(0, 1), 10) !== 8;
}
