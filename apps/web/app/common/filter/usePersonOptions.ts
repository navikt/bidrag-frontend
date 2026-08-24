import type { PersonDto } from "@bidrag/api/PersonApi";
import { useBidragCommons } from "@bidrag/common";
import { unikeVerdier } from "@bidrag/utils";
import { useMemo } from "react";
import { useHentFlerePersoninformasjonSuspense } from "~/api/useApi";
import { IdentQueryParamMapper } from "./IdentQueryParamMapper";

type NameFunction = (person: PersonDto) => string | undefined;

const fullName: NameFunction = (person) => `${person.visningsnavn}, ${person.ident}`;
const shortName: NameFunction = (person) => person.fornavn ?? person.visningsnavn;

export function usePersonOptions(idents: string[]) {
    const { erMaskert } = useBidragCommons();

    const unikeIdents = useMemo(() => unikeVerdier(idents).sort(), [idents]);
    const personResultater = useHentFlerePersoninformasjonSuspense(unikeIdents);
    const personer: Map<string, PersonDto | undefined> = new Map(
        unikeIdents.map((ident, i) => [ident, personResultater[i]?.data]),
    );
    const mapper = new IdentQueryParamMapper(unikeIdents);

    const nullsafeLabel = (ident: string, name: NameFunction) => {
        const person = personer.get(ident);
        if (person) {
            return name(person) ?? ident;
        }
        return ident;
    };

    const option = (ident: string, name: NameFunction) => ({
        label: erMaskert ? "**** ****" : nullsafeLabel(ident, name),
        value: ident,
    });

    const optionsFunction = (name: NameFunction = fullName) => unikeIdents.map((ident) => option(ident, name));

    const selectedOptions = (selected: string[], name: NameFunction = shortName) =>
        mapper.toIdents(selected).map((ident) => option(ident, name));

    return {
        mapper,
        options: optionsFunction(),
        selectedOptions,
    };
}
