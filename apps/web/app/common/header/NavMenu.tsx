import { Tabs } from "@navikt/ds-react";
import { Link, useLocation } from "react-router";

export interface NavMenuItem {
    label: string;
    href: string;
}

const DEFAULT_NAV_ITEMS: NavMenuItem[] = [
    { label: "Sak", href: "/sak" },
    { label: "Forsendelse", href: "/forsendelse" },
    { label: "Dokument", href: "/dokument" },
    { label: "Bidrag", href: "/bidrag" },
];

interface NavMenuProps {
    items?: NavMenuItem[];
}

export function NavMenu({ items = DEFAULT_NAV_ITEMS }: NavMenuProps) {
    const location = useLocation();
    const activeHref = items.find((item) => location.pathname.startsWith(item.href))?.href ?? "";

    return (
        <nav aria-label="Hovednavigasjon">
            <Tabs value={activeHref} selectionFollowsFocus>
                <Tabs.List>
                    {items.map((item) => (
                        <Tabs.Tab key={item.href} value={item.href} label={item.label} as={Link} to={item.href} />
                    ))}
                </Tabs.List>
            </Tabs>
        </nav>
    );
}
