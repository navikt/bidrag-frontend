import { SideNav, type SideNavItem } from "~/common/navigation/SideNav.tsx";

export default function BrukerMeny({ brukerId }: { brukerId: string }) {
    const items: SideNavItem[] = [
        { label: "Brukeroversikt", href: `/bruker/${brukerId}` },
        { label: "Brukerreskontro", href: `/bruker/${brukerId}/reskontro` },
        { label: "Sum pr sak", href: `/bruker/${brukerId}/sumprsak` },
        { label: "Innkreving", href: `/bruker/${brukerId}/innkreving` },
    ];

    return <SideNav items={items} ariaLabel="Brukermeny" />;
}
