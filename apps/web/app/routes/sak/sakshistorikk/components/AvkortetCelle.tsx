import { Tooltip } from "@navikt/ds-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Klasser for en `DataGrid` med `AvkortetCelle` i siste kolonne. Siste kolonne tar plassen de andre
 * kolonnene ikke bruker, men minst 12rem, slik at teksten er lesbar. Teksten i de andre cellene
 * brytes ikke, fordi `w-full` ellers gir de andre kolonnene minste mulige bredde. Halv cellepadding
 * og overskrifter over flere linjer gjør at tabellen tar mindre plass i et smalt vindu. Er vinduet
 * for smalt likevel, ruller alle kolonnene sammen sideveis. Linjene er ett hakk mørkere enn
 * standard, slik at radene er lettere å skille.
 */
export const tabellMedAvkortetSisteKolonne =
    "[&_tr>*:last-child]:w-full [&_tr>*:last-child]:min-w-48 [&_th_*]:whitespace-normal [&_td:not(:last-child)>*]:whitespace-nowrap [&_td>*]:px-2 [&_th>*]:px-2 [--ax-border-neutral-subtle:var(--ax-neutral-500)]";

/**
 * Tabellcelle for en lang tekst i siste kolonne. `w-0 min-w-full` gjør at teksten ikke bestemmer
 * kolonnebredden, slik at kolonnen bare tar plassen de andre kolonnene ikke bruker. Teksten kuttes
 * da i bredden, og hele teksten vises over flere linjer i en tooltip når den er kuttet.
 * Tabellen må gi siste kolonne `w-full`, se `tabellMedAvkortetSisteKolonne`.
 */
export function AvkortetCelle({ tekst, children }: { tekst: string; children?: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [åpen, setÅpen] = useState(false);
    // Uten lenke eller knapp i cellen må cellen selv kunne få fokus, slik at tastaturbrukere kan åpne tooltipen.
    const [harFokuserbartInnhold, setHarFokuserbartInnhold] = useState(false);

    useEffect(() => {
        setHarFokuserbartInnhold(ref.current?.querySelector("a[href], button") != null);
    });

    // Innholdet kan kutte teksten selv (f.eks. `BodyShort truncate`), så sjekk også underelementene.
    const erAvkortet = () => {
        const element = ref.current;
        if (element == null) return false;
        return [element, ...element.querySelectorAll("*")].some((el) => el.scrollWidth > el.clientWidth);
    };

    return (
        <Tooltip
            content={tekst}
            maxChar={Number.POSITIVE_INFINITY}
            describesChild
            open={åpen}
            onOpenChange={(skalÅpnes) => setÅpen(skalÅpnes && erAvkortet())}
            className="max-w-[60ch] whitespace-normal text-left"
        >
            <div
                ref={ref}
                tabIndex={harFokuserbartInnhold ? undefined : 0}
                className="w-0 min-w-full truncate [&_*]:min-w-0 [&_a]:max-w-full [&_svg]:shrink-0"
            >
                {children ?? tekst}
            </div>
        </Tooltip>
    );
}
