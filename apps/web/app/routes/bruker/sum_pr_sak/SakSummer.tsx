import type { Bidragssak } from "@bidrag/api/BidragReskontroApi";
import { RolleTag, type RolleTypeAbbreviation, useTilgangssjekkSak } from "@bidrag/common";
import { Alert, Box, Detail, HStack, Label, Link, VStack } from "@navikt/ds-react";
import { Link as RouterLink } from "react-router";
import { useHentSak } from "~/api/useApi.ts";
import { SaksumTabellBM } from "~/routes/bruker/sum_pr_sak/SaksumTabellBM.tsx";
import { SaksumTabellBP } from "~/routes/bruker/sum_pr_sak/SaksumTabellBP.tsx";
import { SaksumTabellRM } from "~/routes/bruker/sum_pr_sak/SaksumTabellRM.tsx";
import { EnhetsNavn } from "~/routes/sak/fogdhistorikk/components/EnhetsNavn.tsx";

interface SakSummerProps {
    ident: string;
    bidragSak: Bidragssak;
}

export function SakSummer({ bidragSak, ident }: SakSummerProps) {
    const saksnummer = bidragSak.saksnummer ?? undefined;
    const { harTilgang, TilgangAlert } = useTilgangssjekkSak(saksnummer);
    const { data: sak } = useHentSak(saksnummer, false, harTilgang);

    if (!saksnummer) {
        return <Alert variant={"warning"}>Saksnummer mangler for bidragssak</Alert>;
    }

    const nullsafeSaknummer = saksnummer;
    const rolle = sak?.roller.find((rolle) => rolle.fodselsnummer === ident);
    const isRMForSegSelv = ident === rolle?.reellMottaker?.ident;
    const rolleType = isRMForSegSelv ? "RM" : rolle?.type;

    function renderTabell() {
        if (!harTilgang && TilgangAlert) {
            return <TilgangAlert />;
        }
        switch (rolleType) {
            case "BP":
                return <SaksumTabellBP ident={ident} saksnummer={nullsafeSaknummer} bidragSak={bidragSak} sak={sak} />;
            case "BM":
                return <SaksumTabellBM ident={ident} saksnummer={nullsafeSaknummer} bidragSak={bidragSak} sak={sak} />;
            case "RM":
                return <SaksumTabellRM ident={ident} saksnummer={nullsafeSaknummer} bidragSak={bidragSak} sak={sak} />;
            case "BA":
            case "FR":
                return <Alert variant={"info"}>Visning for rolle {rolleType} er ikke støttet</Alert>;
        }
        return null;
    }
    const SakSum = () => (
        <VStack gap={"space-16"}>
            <HStack justify={"space-between"}>
                <HStack gap={"space-8"}>
                    {rolleType && <RolleTag rolleType={rolleType as unknown as RolleTypeAbbreviation} />}
                    <Label>
                        Sak{" "}
                        <Link as={RouterLink} to={`/sak/${bidragSak.saksnummer}/reskontro`}>
                            {bidragSak.saksnummer}
                        </Link>{" "}
                    </Label>
                    <Detail as={"span"}>
                        Enhet: {sak?.eierfogd} <EnhetsNavn enhetsnummer={sak?.eierfogd ?? null} />
                    </Detail>
                </HStack>
            </HStack>
            <Box
                background={"default"}
                borderColor="neutral-subtle"
                padding="space-16"
                borderWidth="1"
                borderRadius="4"
            >
                {renderTabell()}
            </Box>
        </VStack>
    );

    return (
        <Box
            borderColor="neutral-subtle"
            background={"neutral-soft"}
            padding="space-16"
            borderWidth="1"
            borderRadius="4"
        >
            <SakSum />
        </Box>
    );
}
