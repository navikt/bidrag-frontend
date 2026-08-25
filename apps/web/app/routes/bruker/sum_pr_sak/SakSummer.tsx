import type { Bidragssak, SaksinformasjonBarn } from "@bidrag/api/BidragReskontroApi";
import { RolleTag, type RolleTypeAbbreviation } from "@bidrag/common";
import { sumNullable } from "@bidrag/utils";
import { Alert, Box, Detail, HStack, Label, VStack } from "@navikt/ds-react";
import { useHentSak } from "~/api/useApi.ts";
import { SaksumTabellBP } from "~/routes/bruker/sum_pr_sak/SaksumTabellBP.tsx";
import { useAktivPeriode } from "~/routes/bruker/sum_pr_sak/useAktivPeriode.ts";
import { EnhetsNavn } from "~/routes/sak/fogdhistorikk/components/EnhetsNavn.tsx";

const gjeld = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.restGjeldOffentlig, barn.restGjeldPrivat);
};
const tilUtbetaling = (barn: SaksinformasjonBarn) => {
    return sumNullable(barn.sumForskuddUtbetalt, barn.sumIkkeUtbetalt);
};

interface SakSummerProps {
    ident: string;
    bidragSak: Bidragssak;
}

export function SakSummer({ bidragSak, ident }: SakSummerProps) {
    if (!bidragSak.saksnummer) {
        return <Alert variant={"warning"}>Saksnummer mangler for bidragssak</Alert>;
    }

    const { data: sak } = useHentSak(bidragSak.saksnummer);

    const rolle = sak?.roller.find((rolle) => rolle.fodselsnummer === ident)?.type;

    function renderTabell() {
        switch (rolle) {
            case "BP":
                return <SaksumTabellBP ident={ident} bidragSak={bidragSak} sak={sak} />;
        }
        return <Alert variant={"info"}>Ukjent rolle {rolle}</Alert>;
    }
    const SakSum = () => (
        <VStack gap={"space-16"}>
            <HStack justify={"space-between"}>
                <HStack gap={"space-8"}>
                    {rolle && <RolleTag rolleType={rolle as unknown as RolleTypeAbbreviation} />}
                    <Label>Sak {bidragSak.saksnummer} </Label>
                    <Detail>
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
