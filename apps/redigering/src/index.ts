// Ingen andre pakker i monorepoet importerer redigering-sider direkte per nå.
// Eksporterer ruteoppsettet slik at konsumenter kan importere fra
// "@bidrag/redigering" om nødvendig i fremtiden.
export { default as routes } from "./routes";
