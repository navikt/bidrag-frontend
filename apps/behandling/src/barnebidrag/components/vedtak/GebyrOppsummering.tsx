import { type GebyrRolleV2Dto, type SoknadDetaljerDto, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, type RolleTypeAbbreviation } from "@bidrag/common";
import { Heading, HStack, Label, Table } from "@navikt/ds-react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { PERSON_API } from "../../../common/constants/api";
import text from "../../../common/constants/texts";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { formatterBeløp } from "../../../utils/number-utils";
import { SøknadDetaljerHeader } from "../gebyr/SøknadDetaljerHeader";

const ANTALL_KOLONNER = 4;

type SøknadGruppe = {
    søknad: SoknadDetaljerDto | null;
    gebyrRoller: GebyrRolleV2Dto[];
};

const grupperPerSøknad = (gebyrRoller: GebyrRolleV2Dto[]): SøknadGruppe[] => {
    const grupper = new Map<number | string, SøknadGruppe>();

    for (const gebyrRolle of gebyrRoller) {
        const søknad = gebyrRolle.gebyrDetaljer?.søknad ?? null;
        const key = søknad?.søknadsid ?? "ukjent";
        const eksisterende = grupper.get(key);
        if (eksisterende) {
            eksisterende.gebyrRoller.push(gebyrRolle);
        } else {
            grupper.set(key, { søknad, gebyrRoller: [gebyrRolle] });
        }
    }

    return Array.from(grupper.values()).sort(
        (a, b) => Number(b.søknad?.erHovedsøknad ?? false) - Number(a.søknad?.erHovedsøknad ?? false),
    );
};

const SøknadRad = ({ søknad }: { søknad: SoknadDetaljerDto }) => (
    <Table.Row shadeOnHover={false}>
        <Table.DataCell colSpan={ANTALL_KOLONNER} className="p-0">
            <SøknadDetaljerHeader søknad={søknad} />
        </Table.DataCell>
    </Table.Row>
);

const GebyrRolleRad = ({ gebyrRolle }: { gebyrRolle: GebyrRolleV2Dto }) => {
    const { rolle, gebyrDetaljer } = gebyrRolle;

    return (
        <Table.Row>
            <Table.DataCell>
                <HStack gap="space-8" align="center">
                    <RolleTag
                        rolleType={rolle.rolletype as unknown as RolleTypeAbbreviation}
                        ident={rolle.ident}
                        stønad18År={rolle.stønadstype === Stonadstype.BIDRAG18AAR}
                    />
                    <PersonNavnIdent ident={rolle.ident} />
                </HStack>
            </Table.DataCell>
            <Table.DataCell>{formatterBeløp(gebyrDetaljer.inntekt.skattepliktigInntekt)}</Table.DataCell>
            <Table.DataCell>{gebyrDetaljer.endeligIlagtGebyr ? text.select.ilagt : text.select.fritatt}</Table.DataCell>
            <Table.DataCell>{gebyrDetaljer.begrunnelse}</Table.DataCell>
        </Table.Row>
    );
};

export const GebyrOppsummering = () => {
    const {
        gebyrV3: { saker },
    } = useGetBehandlingV2();

    const unikeIdenter = Array.from(
        new Set(
            saker.flatMap((sak) => [...sak.gebyrRoller, ...sak.gebyr18År].map((gebyrRolle) => gebyrRolle.rolle.ident)),
        ),
    ).filter((ident): ident is string => Boolean(ident));

    useSuspenseQueries({
        queries: unikeIdenter.map((ident) => ({
            queryKey: ["persons", ident],
            queryFn: async () => (await PERSON_API.informasjon.hentPersonPost({ ident })).data,
            staleTime: Number.POSITIVE_INFINITY,
        })),
    });

    const sakerMedGebyr = saker
        .map((sak) => ({
            saksnummer: sak.saksnummer,
            søknadsgrupper: grupperPerSøknad([...sak.gebyrRoller, ...sak.gebyr18År]),
        }))
        .filter((sak) => sak.søknadsgrupper.length > 0);

    if (sakerMedGebyr.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-2">
            <Heading level="3" size="small">
                {text.title.gebyr}
            </Heading>
            {sakerMedGebyr.map(({ saksnummer, søknadsgrupper }) => (
                <div key={saksnummer} className="grid gap-2">
                    {sakerMedGebyr.length > 1 && (
                        <Label size="small">
                            {text.title.sak} {saksnummer}
                        </Label>
                    )}
                    <Table size="small">
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>Rolle</Table.HeaderCell>
                                <Table.HeaderCell>{text.label.skattepliktigeInntekt}</Table.HeaderCell>
                                <Table.HeaderCell>{text.label.gebyr}</Table.HeaderCell>
                                <Table.HeaderCell>{text.label.begrunnelse}</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        {søknadsgrupper.map(({ søknad, gebyrRoller }) => (
                            <Table.Body key={søknad?.søknadsid ?? "ukjent"}>
                                {søknad && <SøknadRad søknad={søknad} />}
                                {gebyrRoller.map((gebyrRolle) => (
                                    <GebyrRolleRad
                                        key={`${søknad?.søknadsid ?? "ukjent"}-${gebyrRolle.rolle.id}`}
                                        gebyrRolle={gebyrRolle}
                                    />
                                ))}
                            </Table.Body>
                        ))}
                    </Table>
                </div>
            ))}
        </div>
    );
};
