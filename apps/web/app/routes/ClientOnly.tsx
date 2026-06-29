import { useEffect, useState, type ReactNode } from "react";

/** Hack for å sørge for at ting kun kjøres på klienten */
export function ClientOnly({ children, fallback = null }: {
    children: React.ReactNode;
    fallback?: React.ReactNode
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <>{fallback}</>;

    return <>{children}</>;
}
