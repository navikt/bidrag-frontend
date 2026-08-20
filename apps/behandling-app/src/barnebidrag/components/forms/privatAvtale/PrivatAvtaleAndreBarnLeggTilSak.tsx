import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, HStack, VStack } from "@navikt/ds-react";
import { SakstilknytningModal } from "../../../../common/components/sak/SakstilknytningTable";
import {
    useGetBehandlingV2,
    useGetSakerForBp,
    useHentPersonForeldre,
    useRefetchFFInfoFn,
} from "../../../../common/hooks/useApiData";
import OpprettSakModal from "../../../../common/sak/OpprettSakModal";
import type { PrivatAvtaleFormValue } from "../../../types/privatAvtaleFormValues";

export default function PrivatAvtaleAndreBarnLeggTilSak({ item }: { item: PrivatAvtaleFormValue }) {
    const refetchFFInfo = useRefetchFFInfoFn(true);
    const { behandlerenhet, roller } = useGetBehandlingV2();
    const foreldre = useHentPersonForeldre(item.gjelderBarn.ident);

    const bpIdent = roller.find((rolle) => rolle.rolletype === Rolletype.BP)?.ident;
    const saker = useGetSakerForBp(item.gjelderBarn.ident);

    const motsattRolle = foreldre.data.find(
        (relasjon) => relasjon.relatertPersonsIdent !== bpIdent,
    )?.relatertPersonsIdent;
    return (
        <VStack gap={"space-2"}>
            {(saker.length === 0 || !motsattRolle) && (
                <Alert variant="warning" size="small" inline>
                    {!motsattRolle
                        ? `Fant ingen motsatt rolle for barnet. Opprett sak eller knytt til en eksisterende sak til BP `
                        : saker.length === 0
                          ? `Det finnes ingen sak for ${item.gjelderBarn.navn}. Opprett sak for å knytte privat avtale.`
                          : `Det finnes ${saker.length} sak(er) for ${item.gjelderBarn.navn}. Velg sak for å knytte privat avtale.`}
                </Alert>
            )}

            <HStack gap={"space-2"}>
                {(saker.length === 0 || !motsattRolle) && (
                    <OpprettSakModal
                        ident={item.gjelderBarn.ident}
                        navn={item.gjelderBarn.navn}
                        bpIdent={bpIdent}
                        rolle={Rolletype.BA}
                        eierfogd={behandlerenhet}
                        onSubmit={() => {
                            refetchFFInfo();
                        }}
                    />
                )}
                {saker.length > 0 && <SakstilknytningModal gjelderBarnIdent={item.gjelderBarn.ident} />}
            </HStack>
        </VStack>
    );
}
