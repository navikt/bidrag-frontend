import { RolleType } from "./RolleType.ts";

/**
 * Migrert fra bidrag-ui (apps/sak-ui/src/utils/personUtils.ts). Kun
 * `getMotpartRolleType` er i bruk i den migrerte "Opprett ny sak"-modalen —
 * resten av det opprinnelige filinnholdet gjaldt sider som ikke er migrert.
 */
export function getMotpartRolleType(rolle: RolleType): RolleType {
    return rolle === RolleType.BP ? RolleType.BM : RolleType.BP;
}
