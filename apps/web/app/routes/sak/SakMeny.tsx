import { useFlag } from "@unleash/proxy-client-react";
import { SideNav, type SideNavItem } from "~/common/navigation/SideNav.tsx";

export default function SakMeny({ saksnummer }: { saksnummer: string }) {
    const visSaksroller = useFlag("bisys.ny_rollebilde");
    const items: SideNavItem[] = [
        { label: "Fogdhistorikk", href: `/sak/${saksnummer}/fogdhistorikk` },
        { label: "Beløpshistorikk", href: `/sak/${saksnummer}/belopshistorikk` },
        { label: "Sakshistorikk", href: `/sak/${saksnummer}/sakshistorikk` },
        ...(visSaksroller ? [{ label: "Saksroller", href: `/sak/${saksnummer}/saksroller` }] : []),
        { label: "Saksreskontro", href: `/sak/${saksnummer}/reskontro` },
        { label: "Dokumenter", href: `/sak/${saksnummer}/dokumenter` },
    ];

    return <SideNav items={items} ariaLabel="Sakmeny" />;
}
