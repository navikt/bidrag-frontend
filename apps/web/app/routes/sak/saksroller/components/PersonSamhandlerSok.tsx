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

    const containerWidth = compact ? "w-full p-0" : "w-[50rem] p-2";
    const inputWidth = compact ? "min-w-0 flex-1" : "w-[30rem]";

    return (
        <div className={`flex gap-2 items-center ${containerWidth}`}>
            <div className="w-full">
                <div className="flex flex-row flex-wrap items-end gap-2">
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
                    <div className="flex flex-row flex-wrap items-end gap-2">
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
