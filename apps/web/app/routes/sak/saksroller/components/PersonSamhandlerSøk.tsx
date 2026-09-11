import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton, SamhandlerSokButton } from "@bidrag/common";
import { Alert, BodyShort, Box, HStack, Loader, Search } from "@navikt/ds-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { useHentSamhandlerEllerPersonForIdent } from "~/api/useApi.ts";

export default function PersonSamhandlerSøk({
    valgIdent,
    label,
    onResult,
    visSamhandlerSøk = false,
    primary = true,
    compact = false,
}: {
    valgIdent?: string;
    label?: string;
    onResult: (data: PersonDto) => void | Promise<void>;
    visSamhandlerSøk?: boolean;
    primary?: boolean;
    compact?: boolean;
}) {
    const samhandlerPersonFn = useHentSamhandlerEllerPersonForIdent(visSamhandlerSøk);
    const [searchErrorMessage, setSearchErrorMessage] = useState<string | undefined>(undefined);
    const [searchValue, setSearchValue] = useState(valgIdent || "");

    function onInputChange(value: string) {
        setSearchValue(value);
        samhandlerPersonFn
            .mutateAsync({ ident: value?.trim() })
            .then(async (data) => {
                if (!data?.isValid) {
                    setSearchErrorMessage("Finnes ingen person eller samhandler med oppgitt ident");
                    return;
                }

                setSearchErrorMessage(undefined);
                try {
                    return await onResult(data);
                } catch (err) {
                    setSearchErrorMessage(err instanceof Error ? err.message : "En feil oppstod");
                }
            })
            .catch(() => {
                setSearchErrorMessage("Finnes ingen person eller samhandler med oppgitt ident");
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
                <HStack gap={compact ? "space-24" : "space-40"} align="end" wrap>
                    <Box
                        asChild
                        flexGrow={compact ? "1" : undefined}
                        minWidth={compact ? "0" : undefined}
                        width={compact ? undefined : "30rem"}
                    >
                        <Search
                            label={label || "Person- eller samhandlerident"}
                            variant={primary ? "primary" : "simple"}
                            description={
                                visSamhandlerSøk
                                    ? "Fødselsnummer, D-nummer (11 siffer) eller samhandler ident"
                                    : "Fødselsnummer eller D-nummer (11 siffer)"
                            }
                            size={compact ? "medium" : "small"}
                            value={searchValue}
                            hideLabel={false}
                            onClick={(e) => e.stopPropagation()}
                            onChange={setSearchValue}
                            onSearchClick={onInputChange}
                            onKeyDown={handleSearchKeyDown}
                        >
                            {primary && <Search.Button type="button" />}
                        </Search>
                    </Box>
                    <HStack gap="space-8" align="end" wrap>
                        <PersonSokButton
                            size={compact ? "medium" : undefined}
                            onError={(feil) => setSearchErrorMessage(feil)}
                            onResult={(data) => {
                                if (data?.ident) onInputChange(data.ident);
                            }}
                        />
                        {visSamhandlerSøk && (
                            <SamhandlerSokButton
                                size={compact ? "medium" : undefined}
                                onResult={(data) => {
                                    if (data?.samhandlerId) onInputChange(data.samhandlerId);
                                }}
                            />
                        )}
                    </HStack>
                </HStack>
                {samhandlerPersonFn.isPending && (
                    <HStack gap="space-8">
                        <Loader size="small" title="Søker…" />
                        <BodyShort>Søker…</BodyShort>
                    </HStack>
                )}
                {(samhandlerPersonFn.error?.message || searchErrorMessage) && (
                    <Box asChild marginBlock="space-4 space-0">
                        <Alert variant="warning" inline size="small">
                            {samhandlerPersonFn.error?.message || searchErrorMessage}
                        </Alert>
                    </Box>
                )}
            </Box>
        </HStack>
    );
}
