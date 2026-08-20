import type { PersonDto } from "@bidrag/api/PersonApi";
import { PersonSokButton, SamhandlerSokButton } from "@bidrag/common";
import { Alert, Loader, Search } from "@navikt/ds-react";
import { useState } from "react";
import { useHentSamhandlerEllerPersonForIdent } from "~/api/useApi.ts";

export default function PersonSamhandlerSok({
    valgIdent,
    label,
    onResult,
    visSamhandlerSøk = false,
    primary = false,
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
                setSearchErrorMessage(undefined);
                if (data?.isValid) {
                    try {
                        return await onResult(data);
                    } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : "En feil oppstod";
                        setSearchErrorMessage(errorMessage);
                    }
                }
            })
            .catch(() => {
                if (!searchErrorMessage) {
                    setSearchErrorMessage("Finnes ingen person eller samhandler med oppgitt ident");
                }
            });
    }

    const containerWidth = compact ? "w-full" : "w-[50rem]";
    const inputWidth = compact ? "w-[30rem]" : "w-[30rem]";
    const gapSize = compact ? "gap-2" : !primary ? "gap-2" : "gap-[3rem]";

    return (
        <div className={`flex gap-2 p-2 items-center ${containerWidth}`}>
            <div className="w-full">
                <div className={`flex flex-row items-center ${gapSize}`}>
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
                        onSearchClick={onInputChange}
                        onChange={setSearchValue}
                    />
                    <div
                        className={`items-center flex ${compact ? "flex-row gap-1 mt-1" : "flex-row gap-2"} ${searchErrorMessage ? "self-end" : "self-end"}`}
                    >
                        <PersonSokButton
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
                    </div>
                </div>
                {samhandlerPersonFn.isPending && (
                    <div className="flex gap-2">
                        <Loader size="small" title="Søker…" />
                        <div>Søker…</div>
                    </div>
                )}
                {(samhandlerPersonFn.error?.message || searchErrorMessage) && (
                    <Alert variant="warning" inline size="small" className="!mb-0 mt-1">
                        {samhandlerPersonFn.error?.message || searchErrorMessage}
                    </Alert>
                )}
            </div>
        </div>
    );
}
