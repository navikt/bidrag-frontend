/* eslint-disable @typescript-eslint/no-explicit-any */

import debounce from "lodash/debounce";
import { useEffect, useMemo, useRef } from "react";
import { useBehandlingProvider } from "../context/BehandlingContext";

export const useDebounce = (callback: (...args: any) => void) => {
    const ref = useRef<(...args: any) => void>(null);
    const { setDebouncing } = useBehandlingProvider();
    const isMounted = useRef(true);

    useEffect(() => {
        ref.current = callback;
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = async (...args: any) => {
            try {
                await Promise.resolve(ref.current?.(...args));
            } finally {
                if (isMounted.current) {
                    setDebouncing(false);
                }
            }
        };

        return debounce(func, 600);
    }, [setDebouncing]);

    useEffect(() => {
        return () => {
            debouncedCallback.cancel();
            setDebouncing(false);
        };
    }, [debouncedCallback, setDebouncing]);

    return (...args: any) => {
        setDebouncing(true);
        debouncedCallback(...args);
    };
};
