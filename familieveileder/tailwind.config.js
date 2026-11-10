/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
    theme: {
        extend: {},
    },
    plugins: [],
    presets: [require("@navikt/ds-tailwind")],
    corePlugins: {
        preflight: false,
    },
};
