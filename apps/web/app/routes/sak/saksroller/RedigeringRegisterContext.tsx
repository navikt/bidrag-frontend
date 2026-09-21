import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface RedigeringRegister {
    harÅpneRedigeringer: boolean;
    registrerÅpen: (id: string, åpen: boolean) => void;
}

const IKKE_TILKOBLET: RedigeringRegister = {
    harÅpneRedigeringer: false,
    registrerÅpen: () => {},
};

const RedigeringRegisterContext = createContext<RedigeringRegister>(IKKE_TILKOBLET);

export function RedigeringRegisterProvider({ children }: { children: React.ReactNode }) {
    const [åpneIder, setÅpneIder] = useState<Set<string>>(() => new Set());

    const registrerÅpen = useCallback((id: string, åpen: boolean) => {
        setÅpneIder((forrige) => {
            const harAlleredeRiktigStatus = forrige.has(id) === åpen;
            if (harAlleredeRiktigStatus) {
                return forrige;
            }

            const neste = new Set(forrige);
            if (åpen) {
                neste.add(id);
            } else {
                neste.delete(id);
            }
            return neste;
        });
    }, []);

    const value = useMemo(() => ({ harÅpneRedigeringer: åpneIder.size > 0, registrerÅpen }), [åpneIder, registrerÅpen]);

    return <RedigeringRegisterContext.Provider value={value}>{children}</RedigeringRegisterContext.Provider>;
}

function useRedigeringRegister(): RedigeringRegister {
    return useContext(RedigeringRegisterContext);
}

export function useHarÅpneRedigeringer(): boolean {
    return useRedigeringRegister().harÅpneRedigeringer;
}

/**
 * Registrerer at en inline-editor (f.eks. reell mottaker-velger eller person-søk) er åpen,
 * slik at lagring kan blokkeres til brukeren har bekreftet eller avbrutt endringen.
 * `id` må være stabil og unik for editoren som registrerer seg.
 */
export function useRegistrerÅpenRedigering(id: string, åpen: boolean) {
    const { registrerÅpen } = useRedigeringRegister();

    useEffect(() => {
        registrerÅpen(id, åpen);
        return () => registrerÅpen(id, false);
    }, [id, åpen, registrerÅpen]);
}
