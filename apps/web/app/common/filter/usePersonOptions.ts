import type { PersonDto } from "@bidrag/api/PersonApi";
import type { SamhandlerDto } from "@bidrag/api/SamhandlerApi";
import { IdentUtils, useBidragCommons } from "@bidrag/common";
import { unikeVerdier } from "@bidrag/utils";
import { useSuspenseQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { hentPersonInfo } from "~/api/query/person.query.ts";
import { hentSamhandlerQuery } from "~/api/query/samhandler.query.ts";
import { IdentQueryParamMapper } from "./IdentQueryParamMapper";

export function usePersonOptions(idents: string[]) {
    const { erMaskert } = useBidragCommons();

    const unikeIdents = useMemo(() => unikeVerdier(idents).sort(), [idents]);
    const personIdents = useMemo(() => unikeIdents.filter((ident) => !IdentUtils.isSamhandlerId(ident)), [unikeIdents]);

    const personResultater = useSuspenseQueries({
        queries: personIdents.map((ident) => hentPersonInfo(ident)),
    });

    const personer: Map<string, PersonDto | undefined> = new Map(
        personIdents.map((ident, i) => [ident, personResultater[i]?.data]),
    );
    const samhandlerIdents = useMemo(
        () => unikeIdents.filter((ident) => IdentUtils.isSamhandlerId(ident)),
        [unikeIdents],
    );
    const samhandlerResultater = useSuspenseQueries({
        queries: samhandlerIdents.map((ident) => hentSamhandlerQuery(ident)),
    });
    const samhandlere: Map<string, SamhandlerDto | undefined> = new Map(
        samhandlerIdents.map((ident, i) => [ident, samhandlerResultater[i]?.data]),
    );

    const mapper = new IdentQueryParamMapper(unikeIdents);

    const nullsafeLabel = (ident: string, short: boolean) => {
        const person = personer.get(ident);
        if (person) {
            if (short) {
                return person.fornavn ?? person.visningsnavn ?? ident;
            }
            return `${person.visningsnavn}, ${person.ident}`;
        }
        const samhandler = samhandlere.get(ident);
        if (samhandler) {
            if (short) {
                return samhandler.navn.substring(0, 10);
            }
            return `${samhandler.navn}, ${ident}`;
        }

        return ident;
    };

    const option = (ident: string, shortName: boolean = false) => ({
        label: erMaskert ? "*********" : nullsafeLabel(ident, shortName),
        value: ident,
    });

    const options = unikeIdents.map((ident) => option(ident));

    const selectedOptions = (selected: string[]) => mapper.toIdents(selected).map((ident) => option(ident, true));

    return {
        mapper,
        options,
        selectedOptions,
    };
}
