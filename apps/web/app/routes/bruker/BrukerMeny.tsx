import { useFlag } from "@unleash/proxy-client-react";
import { SideNav, type SideNavItem } from "~/common/navigation/SideNav.tsx";

export default function BrukerMeny({ brukerId }: { brukerId: string }) {
    const visBrukeroversikt = useFlag("bisys.ny_brukeroversikt");
    const isBrukerPersonopplysningerEnabled = useFlag("behandling.bruker_personopplysninger");

    const items: SideNavItem[] = [
        ...(visBrukeroversikt ? [{ label: "Brukeroversikt", href: `/bruker/${brukerId}` }] : []),
        ...(isBrukerPersonopplysningerEnabled
            ? [{ label: "Brukeropplysninger", href: `/bruker/${brukerId}/personopplysninger`, isNotEnd: true }]
            : []),
        { label: "Brukerreskontro", href: `/bruker/${brukerId}/reskontro` },
        { label: "Sum pr sak", href: `/bruker/${brukerId}/sumprsak` },
        { label: "Innkreving", href: `/bruker/${brukerId}/innkreving` },
    ];

    return <SideNav items={items} ariaLabel="Brukermeny" />;
}
