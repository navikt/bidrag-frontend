import { useLayoutEffect, useRef, useState } from "react";

/**
 * Regner ut hvor mye plass som er reservert UNDER elementet i det delte sidelayoutet
 * (f.eks. Aksel sin `<Page>` som legger til `padding-block-end` etter innholdet, eller
 * en eventuell footer), ved å gå oppover i DOM-treet til `<body>` og summere høyden på
 * påfølgende søsken og bunn-padding/-margin på hvert nivå.
 */
function finnReservertPlassUnder(element: HTMLElement): number {
    let reservertPlass = 0;
    let node: HTMLElement | null = element;

    while (node && node !== document.body) {
        let søsken = node.nextElementSibling as HTMLElement | null;
        while (søsken) {
            reservertPlass += søsken.getBoundingClientRect().height;
            søsken = søsken.nextElementSibling as HTMLElement | null;
        }

        const parent: HTMLElement | null = node.parentElement;
        if (parent) {
            const stil = getComputedStyle(parent);
            reservertPlass += Number.parseFloat(stil.paddingBottom || "0");
            reservertPlass += Number.parseFloat(stil.marginBottom || "0");
        }

        node = parent;
    }

    return reservertPlass;
}

/**
 * Måler hvor mye vertikal plass elementet kan fylle uten at siden (html/body) får scroll.
 *
 * Vi kan ikke bare bruke `window.innerHeight - element.top`, fordi det ligger usynlig
 * plass under elementet i det delte sidelayoutet (se `finnReservertPlassUnder`).
 *
 * Oppdateres ved vindusendring og når layouten rundt elementet endrer størrelse
 * (f.eks. når sakheader lastes inn).
 */
export function useFyllGjenværendeHøyde<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [høyde, setHøyde] = useState<number>();
    const forrigeHøydeRef = useRef<number | undefined>(undefined);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        const oppdaterHøyde = () => {
            const toppOffset = element.getBoundingClientRect().top;
            const reservertPlassUnder = finnReservertPlassUnder(element);
            const nyHøyde = Math.max(window.innerHeight - toppOffset - reservertPlassUnder, 0);

            // Unngår unødvendige re-render/ResizeObserver-løkker for ørsmå avvik.
            if (forrigeHøydeRef.current === undefined || Math.abs(forrigeHøydeRef.current - nyHøyde) > 1) {
                forrigeHøydeRef.current = nyHøyde;
                setHøyde(nyHøyde);
            }
        };

        oppdaterHøyde();

        window.addEventListener("resize", oppdaterHøyde);
        const resizeObserver = new ResizeObserver(oppdaterHøyde);
        resizeObserver.observe(document.body);

        return () => {
            window.removeEventListener("resize", oppdaterHøyde);
            resizeObserver.disconnect();
        };
    }, []);

    return { ref, høyde };
}
