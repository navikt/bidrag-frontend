import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton, SamhandlerSokButton } from "@bidrag/common";
import { BodyShort, Box, HStack, InlineMessage, Loader, Search, VStack } from "@navikt/ds-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useHentSamhandlerEllerPersonForIdent } from "~/api/useApi.ts";
import { hentNyttFødselsnummerMelding } from "../utils.ts";

export default function PersonSamhandlerSøk({
    valgIdent,
    label,
    onResult,
    onError,
    onQueryChange,
    søketype,
    compact = false,
}: {
    valgIdent?: string;
    label?: string;
    onResult: (data: PersonDto) => void | Promise<void>;
    onError: (feil: string) => void;
    onQueryChange?: () => void;
    søketype: "person" | "person-og-samhandler";
    compact?: boolean;
}) {
    const inkluderSamhandler = søketype === "person-og-samhandler";
    const samhandlerPersonFn = useHentSamhandlerEllerPersonForIdent(inkluderSamhandler);
    const [searchErrorMessage, setSearchErrorMessage] = useState<string | undefined>(undefined);
    const [nyttFødselsnummerInfo, setNyttFødselsnummerInfo] = useState<string | undefined>(undefined);
    const [searchValue, setSearchValue] = useState(valgIdent || "");
    const søkeversjon = useRef(0);

    useEffect(
        () => () => {
            søkeversjon.current += 1;
        },
        [],
    );

    function onInputChange(value: string) {
        onQueryChange?.();
        setSearchValue(value);
        const søktVerdi = value?.trim();
        const versjon = ++søkeversjon.current;
        samhandlerPersonFn
            .mutateAsync({ ident: søktVerdi })
            .then(async (data) => {
                if (søkeversjon.current !== versjon) return;

                if (!data?.isValid) {
                    const feil = "Finnes ingen person eller samhandler med oppgitt ident";
                    setSearchErrorMessage(feil);
                    setNyttFødselsnummerInfo(undefined);
                    onError(feil);
                    return;
                }

                setSearchErrorMessage(undefined);
                setNyttFødselsnummerInfo(hentNyttFødselsnummerMelding(data));
                try {
                    return await onResult(data);
                } catch (err) {
                    const feil = err instanceof Error ? err.message : "En feil oppstod";
                    setSearchErrorMessage(feil);
                    onError(feil);
                }
            })
            .catch((err) => {
                if (søkeversjon.current !== versjon) return;

                const erTilgangsfeil = err instanceof Error && !(err as { isAxiosError?: boolean }).isAxiosError;
                const feil = erTilgangsfeil ? err.message : "Finnes ingen person eller samhandler med oppgitt ident";
                setSearchErrorMessage(feil);
                setNyttFødselsnummerInfo(undefined);
                onError(feil);
            });
    }

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter" && searchValue.trim()) {
            event.preventDefault();
            event.stopPropagation();
            onInputChange(searchValue);
        }
    }

    const containerWidth = compact ? "100%" : "50rem";
    const containerPadding = compact ? "space-0" : "space-8";

    return (
        <HStack gap="space-8" align="center" width={containerWidth} padding={containerPadding}>
            <Box width="100%">
                <VStack gap="space-8">
                    <Box
                        flexGrow={compact ? "1" : undefined}
                        minWidth={compact ? "0" : undefined}
                        width={compact ? undefined : "30rem"}
                    >
                        <Search
                            label={label || "Person- eller samhandlerident"}
                            description={
                                inkluderSamhandler
                                    ? "Fødselsnummer, D-nummer (11 siffer) eller samhandler ident"
                                    : "Fødselsnummer eller D-nummer (11 siffer)"
                            }
                            size="small"
                            value={searchValue}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(value) => {
                                søkeversjon.current += 1;
                                onQueryChange?.();
                                setSearchValue(value);
                            }}
                            onSearchClick={onInputChange}
                            onKeyDown={handleSearchKeyDown}
                        >
                            <Search.Button type="button" />
                        </Search>
                    </Box>
                    <BodyShort size="small" textColor="subtle">
                        <PersonSokButton
                            visSomLenke
                            onError={(feil) => {
                                setSearchErrorMessage(feil);
                                onError(feil);
                            }}
                            onResult={(data) => {
                                if (data?.ident) onInputChange(data.ident);
                            }}
                        />
                        {inkluderSamhandler && (
                            <>
                                {" "}
                                <SamhandlerSokButton
                                    visSomLenke
                                    onResult={(data) => {
                                        if (data?.samhandlerId) onInputChange(data.samhandlerId);
                                    }}
                                />
                            </>
                        )}
                    </BodyShort>
                </VStack>
                {samhandlerPersonFn.isPending && (
                    <HStack gap="space-8">
                        <Loader size="small" title="Søker…" />
                        <BodyShort>Søker…</BodyShort>
                    </HStack>
                )}
                {nyttFødselsnummerInfo && !searchErrorMessage && (
                    <Box asChild marginBlock="space-4 space-0">
                        <InlineMessage status="info" size="small">
                            {nyttFødselsnummerInfo}
                        </InlineMessage>
                    </Box>
                )}
                {searchErrorMessage && (
                    <Box asChild marginBlock="space-4 space-0">
                        <InlineMessage status="warning" size="small">
                            {searchErrorMessage}
                        </InlineMessage>
                    </Box>
                )}
            </Box>
        </HStack>
    );
}
