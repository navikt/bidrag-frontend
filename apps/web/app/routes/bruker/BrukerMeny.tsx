import { useFlag } from "@unleash/proxy-client-react";
import { SideNav, type SideNavItem } from "~/common/navigation/SideNav.tsx";

export default function BrukerMeny({ brukerId }: { brukerId: string }) {
    const isBrukerPersonopplysningerEnabled = useFlag("behandling.bruker_personopplysninger");

    const items: SideNavItem[] = [
        { label: "Brukeroversikt", href: `/bruker/${brukerId}` },
        { label: "Brukerreskontro", href: `/bruker/${brukerId}/reskontro` },
        { label: "Sum pr sak", href: `/bruker/${brukerId}/sumprsak` },
        { label: "Innkreving", href: `/bruker/${brukerId}/innkreving` },
    ];

    if (isBrukerPersonopplysningerEnabled) {
        items.splice(1, 0, {
            label: "Brukeropplysninger",
            href: `/bruker/${brukerId}/personopplysninger`,
            isNotEnd: true,
        });
    }

    return <SideNav items={items} ariaLabel="Brukermeny" />;
}
