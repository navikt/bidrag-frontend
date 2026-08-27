import { NavLink } from "react-router";
import styles from "./SideNav.module.css";

export interface SideNavItem {
    label: string;
    href: string;
}

interface SideNavProps {
    /** Meny-punktene som skal vises. Komponenten er generisk og kan gjenbrukes med ulike menyer. */
    items: SideNavItem[];
    /** Tilgjengelig navn på navigasjonslandemerket. */
    ariaLabel?: string;
}

/**
 * Gjenbrukbar, venstre-plassert sidenavigasjon.
 *
 * Enkel statisk variant uten kollaps – kan utvides med det senere ved behov.
 */
export function SideNav({ items, ariaLabel = "Sidemeny" }: SideNavProps) {
    return (
        <nav aria-label={ariaLabel} className={styles.nav}>
            <ul className={styles.list}>
                {items.map((item) => (
                    <li key={item.href} className={styles.listItem}>
                        <NavLink to={item.href} className={styles.link} end>
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
