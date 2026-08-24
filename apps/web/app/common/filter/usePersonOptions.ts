import type { PersonDto } from "@bidrag/api/PersonApi";
import { useBidragCommons } from "@bidrag/common";
import { unikeVerdier } from "@bidrag/utils";
import { useMemo } from "react";
import { IdentQueryParamMapper } from "~/common/filter/IdentQueryParamMapper.ts";

type NameFunction = (person: PersonDto) => string | undefined;

const fullName: NameFunction = (person) => `${person.visningsnavn}, ${person.ident}`;
const shortName: NameFunction = (person) => person.fornavn ?? person.visningsnavn;

export function usePersonOptions(idents: string[]) {
    const { useHentPersonData, erMaskert } = useBidragCommons();

    const unikeIdents = useMemo(() => unikeVerdier(idents).sort(), [idents]);
    const personer: Map<string, PersonDto> = new Map(
        unikeIdents.map((ident) => [ident, useHentPersonData(ident).data]),
    );
    const mapper = new IdentQueryParamMapper(unikeIdents);

    const nullsafeLabel = (ident: string, name: NameFunction) => {
        const person = personer.get(ident);
        return (person && name(person)) ?? ident;
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
