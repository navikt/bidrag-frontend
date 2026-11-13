import { ChevronLeftDoubleIcon, ChevronRightDoubleIcon } from "@navikt/aksel-icons";
import { Button } from "@navikt/ds-react";
import { useState } from "react";
import { NavLink } from "react-router";
import styles from "./SideNav.module.css";

export interface SideNavItem {
    label: string;
    href: string;
    isNotEnd?: boolean;
}

interface SideNavProps {
    /** Meny-punktene som skal vises. Komponenten er generisk og kan gjenbrukes med ulike menyer. */
    items: SideNavItem[];
    /** Tilgjengelig navn på navigasjonslandemerket. */
    ariaLabel?: string;
    /** Styrer om menyen er skjult. Uten denne holder komponenten selv rede på tilstanden. */
    kollapset?: boolean;
    onKollapsetChange?: (kollapset: boolean) => void;
}

/**
 * Gjenbrukbar, venstre-plassert sidenavigasjon. Saksbehandler kan skjule menyen, slik at innholdet får
 * mer plass; da vises bare knappen som viser menyen igjen.
 */
export function SideNav({ items, ariaLabel = "Sidemeny", kollapset, onKollapsetChange }: SideNavProps) {
    const [egenKollapset, setEgenKollapset] = useState(false);
    const erKollapset = kollapset ?? egenKollapset;
    const settKollapset = (verdi: boolean) => {
        setEgenKollapset(verdi);
        onKollapsetChange?.(verdi);
    };

    return (
        <nav aria-label={ariaLabel} className={erKollapset ? `${styles.nav} ${styles.kollapset}` : styles.nav}>
            <div className={styles.toggle}>
                <Button
                    size="small"
                    variant="tertiary-neutral"
                    icon={
                        erKollapset ? (
                            <ChevronRightDoubleIcon title="Vis meny" />
                        ) : (
                            <ChevronLeftDoubleIcon title="Skjul meny" />
                        )
                    }
                    aria-expanded={!erKollapset}
                    onClick={() => settKollapset(!erKollapset)}
                />
            </div>
            {!erKollapset && (
                <ul className={styles.list}>
                    {items.map((item) => (
                        <li key={item.href} className={styles.listItem}>
                            <NavLink to={item.href} className={styles.link} end={!item.isNotEnd}>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
        </nav>
    );
}
