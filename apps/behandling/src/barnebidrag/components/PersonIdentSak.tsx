import { type Rolletype, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTypeAbbreviation, RolleTypeFullName } from "@bidrag/common";
import { BodyShort, VStack } from "@navikt/ds-react";
import { useMemo } from "react";
import { useGetBehandlingV2 } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";

export default function PersonIdentSak({
    ident,
    rolle: rolleInput,
    stønadstype,
}: {
    ident: string;
    rolle?: RolleTypeFullName | Rolletype;
    stønadstype?: Stonadstype;
}) {
    const { roller } = useGetBehandlingV2();

    const { nyBehandlingHeader } = useFeatureToogle();
    const harUlikeSaksnummer = useMemo(
        () => roller.map((r) => r.saksnummer).filter((value, index, self) => self.indexOf(value) === index).length > 1,
        [roller],
    );
    const saksnummerIdent = useMemo(() => roller.find((r) => r.ident === ident)?.saksnummer, [roller, ident]);
    const rolle = useMemo(
        () =>
            (rolleInput as RolleTypeFullName) ??
            // @ts-expect-error
            (roller.find((r) => r.ident === ident)?.rolletype as RolleTypeFullName),
        [roller, ident],
    );
    //@ts-expect-error
    const erBp = rolle === RolleTypeAbbreviation.BP || rolle === RolleTypeFullName.BIDRAGSPLIKTIG;
    return (
        <VStack gap="space-0">
            <PersonNavnIdent
                rolle={rolle ?? RolleTypeFullName.BARN}
                ident={ident}
                variant="navnIdent"
                bareFornavn
                visAlder={(rolle as string) === RolleTypeAbbreviation.BA}
                stønad18År={stønadstype === Stonadstype.BIDRAG18AAR}
            />
            {!nyBehandlingHeader && harUlikeSaksnummer && saksnummerIdent && !erBp && (
                <BodyShort className="self-end mr-[5px]" size="small">
                    sak {saksnummerIdent}
                </BodyShort>
            )}
        </VStack>
    );
}
