import { useEffect, useRef } from "react";
import type { UseFormReset } from "react-hook-form";
import type { SakRedigeringData } from "../sakvisning-schema.ts";

export function useInitialiserSaksrollerForm({
    berikedeRoller,
    dataUpdatedAt,
    reset,
    saksnummer,
    onDataReset,
}: {
    berikedeRoller: SakRedigeringData["roller"];
    dataUpdatedAt: number;
    reset: UseFormReset<SakRedigeringData>;
    saksnummer: string;
    onDataReset: () => void;
}) {
    const lastDataUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (berikedeRoller.length === 0 || lastDataUpdateRef.current === dataUpdatedAt) {
            return;
        }

        lastDataUpdateRef.current = dataUpdatedAt;
        onDataReset();
        reset({
            saksnummer,
            roller: berikedeRoller,
        });
    }, [berikedeRoller, dataUpdatedAt, onDataReset, reset, saksnummer]);
}
