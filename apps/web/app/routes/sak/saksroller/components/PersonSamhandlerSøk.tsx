import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton, SamhandlerSokButton } from "@bidrag/common";
import { Alert, BodyShort, Box, HStack, Loader, Search } from "@navikt/ds-react";
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

    const containerWidth = compact ? "100%" : "50rem";
    const containerPadding = compact ? "space-0" : "space-8";
    const inputWidth = compact ? "min-w-0 flex-1" : "w-[30rem]";

    return (
        <HStack gap="space-8" align="center" width={containerWidth} padding={containerPadding}>
            <Box width="100%">
                <HStack gap="space-8" align="end" wrap>
                    <Search
                        label={label || "Person- eller samhandlerident"}
                        variant={primary ? "primary" : "simple"}
                        description={
                            visSamhandlerSøk
                                ? "Fødselsnummer, D-nummer (11 siffer) eller samhandler ident"
                                : "Fødselsnummer eller D-nummer (11 siffer)"
                        }
                        size="small"
                        className={inputWidth}
                        value={searchValue}
                        hideLabel={false}
                        onClick={(e) => e.stopPropagation()}
                        onChange={setSearchValue}
                        onSearchClick={onInputChange}
                        onKeyUp={(event) => {
                            if (!primary && event.key === "Enter" && searchValue.trim()) {
                                onInputChange(searchValue);
                            }
                        }}
                    />
                    <HStack gap="space-8" align="end" wrap>
                        <PersonSokButton
                            onError={(feil) => setSearchErrorMessage(feil)}
                            onResult={(data) => {
                                if (data?.ident) onInputChange(data.ident);
                            }}
                        />
                        {visSamhandlerSøk && (
                            <SamhandlerSokButton
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
                    <Alert variant="warning" inline size="small" className="!mb-0 mt-1">
                        {samhandlerPersonFn.error?.message || searchErrorMessage}
                    </Alert>
                )}
            </Box>
        </HStack>
    );
}
