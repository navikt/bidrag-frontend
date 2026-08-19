export default function validateFnr(value: string) {
    const elevenDigits = new RegExp("^\\d{11}$");
    return elevenDigits.test(value) && parseInt(value.substring(0, 1)) !== 8;
}
