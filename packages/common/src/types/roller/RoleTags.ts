import type { Tag } from "@navikt/ds-react";
import type { ComponentProps } from "react";
import { RolleTypeAbbreviation, RolleTypeDeprecated, RolleTypeFullName } from "./RolleType";

type TagVariant = ComponentProps<typeof Tag>["variant"];

export const ROLE_TAGS_REVURDERING: Record<string, TagVariant> = {
    [RolleTypeAbbreviation.BM]: "success-filled",
    [RolleTypeAbbreviation.BP]: "warning",
    [RolleTypeAbbreviation.BA]: "alt1-filled",
    [RolleTypeAbbreviation.RM]: "alt3",
    [RolleTypeAbbreviation.FR]: "error",

    [RolleTypeFullName.BIDRAGSMOTTAKER]: "success-filled",
    [RolleTypeFullName.BIDRAGSPLIKTIG]: "warning",
    [RolleTypeFullName.BARN]: "alt1-filled",
    [RolleTypeFullName.REELMOTTAKER]: "alt3",
    [RolleTypeFullName.FEILREGISTRERT]: "error",

    [RolleTypeDeprecated.BIDRAGS_MOTTAKER]: "success-filled",
    [RolleTypeDeprecated.BIDRAGS_PLIKTIG]: "warning",
    [RolleTypeDeprecated.REELL_MOTTAKER]: "alt3",
};
export const ROLE_TAGS: Record<string, TagVariant> = {
    [RolleTypeAbbreviation.BM]: "success",
    [RolleTypeAbbreviation.BP]: "warning",
    [RolleTypeAbbreviation.BA]: "alt1",
    [RolleTypeAbbreviation.RM]: "alt3",
    [RolleTypeAbbreviation.FR]: "error",

    [RolleTypeFullName.BIDRAGSMOTTAKER]: "success",
    [RolleTypeFullName.BIDRAGSPLIKTIG]: "warning",
    [RolleTypeFullName.BARN]: "alt1",
    [RolleTypeFullName.REELMOTTAKER]: "alt3",
    [RolleTypeFullName.FEILREGISTRERT]: "error",

    [RolleTypeDeprecated.BIDRAGS_MOTTAKER]: "success",
    [RolleTypeDeprecated.BIDRAGS_PLIKTIG]: "warning",
    [RolleTypeDeprecated.REELL_MOTTAKER]: "alt3",
};
export const ROLE_FORKORTELSER: Record<string, string> = {
    [RolleTypeFullName.BIDRAGSMOTTAKER]: "BM",
    [RolleTypeFullName.BIDRAGSPLIKTIG]: "BP",
    [RolleTypeFullName.BARN]: "BA",
    [RolleTypeFullName.REELMOTTAKER]: "RM",
    [RolleTypeFullName.FEILREGISTRERT]: "FR",

    [RolleTypeDeprecated.BIDRAGS_MOTTAKER]: "BM",
    [RolleTypeDeprecated.BIDRAGS_PLIKTIG]: "BP",
    [RolleTypeDeprecated.REELL_MOTTAKER]: "RM",
} as const;
