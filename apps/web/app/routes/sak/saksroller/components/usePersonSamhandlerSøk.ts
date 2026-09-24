import type { PersonDto } from "@bidrag/api/PersonApi";
import { useEffect, useRef, useState } from "react";
import { useHentSamhandlerEllerPersonForIdent } from "~/api/useApi.ts";
import { hentNyttFødselsnummerMelding } from "../utils.ts";

export function usePersonSamhandlerSøk({
    valgIdent,
    onResult,
    onError,
    onQueryChange,
    inkluderSamhandler,
}: {
    valgIdent?: string;
    onResult: (data: PersonDto) => void | Promise<void>;
    onError: (feil: string) => void;
    onQueryChange?: () => void;
    inkluderSamhandler: boolean;
}) {
    const samhandlerPersonFn = useHentSamhandlerEllerPersonForIdent(inkluderSamhandler);
    const [searchErrorMessage, setSearchErrorMessage] = useState<string>();
    const [nyttFødselsnummerInfo, setNyttFødselsnummerInfo] = useState<string>();
    const [searchValue, setSearchValue] = useState(valgIdent || "");
    const søkeversjon = useRef(0);

    useEffect(
        () => () => {
            søkeversjon.current += 1;
        },
        [],
    );

    const onInputChange = (value: string) => {
        onQueryChange?.();
        setSearchValue(value);
        const søktVerdi = value.trim();
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
                    await onResult(data);
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
    };

    const onSearchValueChange = (value: string) => {
        søkeversjon.current += 1;
        onQueryChange?.();
        setSearchValue(value);
    };

    return {
        samhandlerPersonFn,
        searchErrorMessage,
        nyttFødselsnummerInfo,
        searchValue,
        onInputChange,
        onSearchValueChange,
    };
}
