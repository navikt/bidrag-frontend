import { IdentUtils } from "@bidrag/common";
import { HStack, Search } from "@navikt/ds-react";
import { useFlag } from "@unleash/proxy-client-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { type BidragLenke, useBidragLenker } from "~/common/navigation/useBidragLenker.ts";
import { useObfuscateFnr } from "~/common/person/useObfuscateFnr.ts";

export function BrukerOgSakSok() {
    const [search, setSearch] = useState<string>("");
    const [searchError, setSearchError] = useState<string>();
    const { sakLenke, brukerLenke } = useBidragLenker();
    const navigate = useNavigate();
    const { encodeFnr } = useObfuscateFnr();
    const enabledFlag = useFlag("frontend.sok-fnr-sak");

    async function navigerTil(lenke: BidragLenke | undefined) {
        if (!lenke) {
            setSearchError("Fant ikke adressen til Bisys. Prøv igjen senere.");
            return;
        }
        if (lenke.ekstern) {
            window.location.assign(lenke.href);
        } else {
            await navigate(lenke.href);
        }
        setSearch("");
        setSearchError(undefined);
    }

    async function doSearch() {
        setSearchError("");
        const isFnr = IdentUtils.isFnr(search);
        const isSak = IdentUtils.isSaksnummer(search);

        if (isFnr) {
            const obfuscatedFnr = encodeFnr(search);
            await navigerTil(brukerLenke(obfuscatedFnr));
            return;
        }

        if (isSak) {
            await navigerTil(sakLenke(search));
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
                autoComplete={"off"}
                onChange={setSearch}
                error={searchError}
            />
        </HStack>
    );
}
