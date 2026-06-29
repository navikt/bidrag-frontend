import {type ReactNode, useEffect, useState} from "react";

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/** Hack for å sørge for at ting kun kjøres på klienten */
export function ClientOnly({children, fallback = null}: ClientOnlyProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <>{fallback}</>;

    return <>{children}</>;
}
