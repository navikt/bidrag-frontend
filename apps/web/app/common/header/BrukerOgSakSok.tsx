import { IdentUtils } from "@bidrag/common";
import { HStack, Search } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";

export function BrukerOgSakSok() {
    const [search, setSearch] = useState<string>();
    const [searchError, setSearchError] = useState<string>();
    const navigate = useNavigate();
    const { encodeFnr } = useObfuscateFnr();
    const enabledFlag = useFlag("frontend.sok-fnr-sak");

    async function doSearch() {
        setSearchError(undefined);
        const value = search ?? "";
        const isFnr = IdentUtils.isFnr(value);
        const isSak = IdentUtils.isSaksnummer(value);

        if (isFnr) {
            const obfuscatedFnr = encodeFnr(value);
            await navigate({ pathname: `/bruker/${obfuscatedFnr}` });
            setSearch("");
            setSearchError(undefined);
            return;
        }

        if (isSak) {
            await navigate({ pathname: `/sak/${value}` });
            setSearch("");
            setSearchError(undefined);
            return;
        }
        setSearchError("Ugyldig søk. Søk på fødselsnummer eller saksnummer.");
    }

    if (!enabledFlag) {
        return null;
    }

    return (
        <HStack
            as="form"
            paddingInline="space-20"
            align="center"
            onSubmit={(e) => {
                e.preventDefault();
                doSearch();
            }}
        >
            <Search
                label="Søk"
                size="small"
                variant="simple"
                placeholder="Finn person eller sak"
                value={search}
                onChange={setSearch}
                error={searchError}
            />
        </HStack>
    );
}
