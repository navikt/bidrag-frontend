import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton, SamhandlerSokButton } from "@bidrag/common";
import { BodyShort, Box, HStack, InlineMessage, Loader, Search, VStack } from "@navikt/ds-react";
import type { KeyboardEvent } from "react";
import { usePersonSamhandlerSøk } from "./usePersonSamhandlerSøk.ts";

const kompaktLayout = {
    bredde: "100%",
    padding: "space-0",
    søkefelt: { flexGrow: "1", minWidth: "0" },
} as const;

const standardLayout = {
    bredde: "50rem",
    padding: "space-8",
    søkefelt: { width: "30rem" },
} as const;

function søkebeskrivelse(inkluderSamhandler: boolean) {
    return inkluderSamhandler
        ? "Fødselsnummer, D-nummer (11 siffer) eller samhandler ident"
        : "Fødselsnummer eller D-nummer (11 siffer)";
}

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
    const {
        samhandlerPersonFn,
        searchErrorMessage,
        nyttFødselsnummerInfo,
        searchValue,
        onInputChange,
        onSearchError,
        onSearchValueChange,
    } = usePersonSamhandlerSøk({
        valgIdent,
        onResult,
        onError,
        onQueryChange,
        inkluderSamhandler,
    });

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter" && searchValue.trim()) {
            event.preventDefault();
            event.stopPropagation();
            onInputChange(searchValue);
        }
    }

    const layout = compact ? kompaktLayout : standardLayout;

    return (
        <HStack gap="space-8" align="center" width={layout.bredde} padding={layout.padding}>
            <Box width="100%">
                <VStack gap="space-8">
                    <Box {...layout.søkefelt}>
                        <Search
                            label={label || "Person- eller samhandlerident"}
                            description={søkebeskrivelse(inkluderSamhandler)}
                            size="small"
                            value={searchValue}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(value) => {
                                onSearchValueChange(value);
                            }}
                            onSearchClick={onInputChange}
                            onKeyDown={handleSearchKeyDown}
                        >
                            <Search.Button type="button" loading={samhandlerPersonFn.isPending} />
                        </Search>
                    </Box>
                    <BodyShort size="small" textColor="subtle">
                        <PersonSokButton
                            visSomLenke
                            onError={onSearchError}
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
                <Søkestatus
                    søker={samhandlerPersonFn.isPending}
                    info={nyttFødselsnummerInfo}
                    feilmelding={searchErrorMessage}
                />
            </Box>
        </HStack>
    );
}

function Søkestatus({ søker, info, feilmelding }: { søker: boolean; info?: string; feilmelding?: string }) {
    return (
        <>
            {søker && (
                <HStack gap="space-8">
                    <Loader size="small" title="Søker…" />
                    <BodyShort>Søker…</BodyShort>
                </HStack>
            )}
            {info && !feilmelding && <Søkemelding status="info">{info}</Søkemelding>}
            {feilmelding && <Søkemelding status="warning">{feilmelding}</Søkemelding>}
        </>
    );
}

function Søkemelding({ status, children }: { status: "info" | "warning"; children: string }) {
    return (
        <Box asChild marginBlock="space-4 space-0">
            <InlineMessage status={status} size="small">
                {children}
            </InlineMessage>
        </Box>
    );
}
