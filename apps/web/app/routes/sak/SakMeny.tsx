import { SideNav, type SideNavItem } from "~/common/navigation/SideNav.tsx";

export default function SakMeny({ saksnummer }: { saksnummer: string }) {
    const items: SideNavItem[] = [
        { label: "Fogdhistorikk", href: `/sak/${saksnummer}/fogdhistorikk` },
        { label: "Beløpshistorikk", href: `/sak/${saksnummer}/belopshistorikk` },
        { label: "Sakshistorikk", href: `/sak/${saksnummer}/sakshistorikk` },
        { label: "Saksreskontro", href: `/sak/${saksnummer}/reskontro` },
        { label: "Dokumenter", href: `/sak/${saksnummer}/dokumenter` },
    ];

    return <SideNav items={items} ariaLabel="Sakmeny" />;
}
