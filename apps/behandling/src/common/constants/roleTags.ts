import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";

export const ROLE_TAGS = {
    [Rolletype.BM]: "success",
    [Rolletype.BP]: "alt1",
    [Rolletype.BA]: "alt1",
    [Rolletype.RM]: "alt3",
    [Rolletype.FR]: "alt3",
} as const;
export const ROLE_TAGS_REVURDERING = {
    [Rolletype.BM]: "success-filled",
    [Rolletype.BP]: "alt1",
    [Rolletype.BA]: "alt1-filled",
    [Rolletype.RM]: "alt3",
    [Rolletype.FR]: "alt3",
} as const;
export const ROLE_FORKORTELSER = {
    [Rolletype.BM]: "BM",
    [Rolletype.BP]: "BP",
    [Rolletype.BA]: "BA",
    [Rolletype.RM]: "RM",
    [Rolletype.FR]: "FR",
} as const;
