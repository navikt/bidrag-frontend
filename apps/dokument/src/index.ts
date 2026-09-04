// Ingen andre pakker i monorepoet importerer dokument-sider direkte per nå.
// Eksporterer ruteoppsettet slik at konsumenter kan importere fra
// "@bidrag/dokument" om nødvendig i fremtiden.
export { default as routes } from "./routes";
