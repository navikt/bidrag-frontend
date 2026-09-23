import { type GebyrRolleV2Dto, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent, RolleTag, type RolleTypeAbbreviation } from "@bidrag/common";
import { Accordion, BodyShort, HStack, Table } from "@navikt/ds-react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { PERSON_API } from "../../../common/constants/api";
import text from "../../../common/constants/texts";
import { useGetBehandlingV2 } from "../../../common/hooks/useApiData";
import { formatterBeløp } from "../../../utils/number-utils";

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

    const harGebyr = saker.some((sak) => sak.gebyrRoller.length > 0 || sak.gebyr18År.length > 0);
    if (!harGebyr) {
        return null;
    }

    return (
        <Accordion size="small">
            <Accordion.Item>
                <Accordion.Header>{text.title.gebyr}</Accordion.Header>
                <Accordion.Content>
                    <div className="grid gap-4">
                        {saker.map((sak) => {
                            const alleGebyrRoller = [...sak.gebyrRoller, ...sak.gebyr18År];
                            if (alleGebyrRoller.length === 0) {
                                return null;
                            }

                            return (
                                <div key={sak.saksnummer} className="grid gap-2">
                                    {saker.length > 1 && (
                                        <BodyShort size="small" weight="semibold">
                                            {text.title.sak} {sak.saksnummer}
                                        </BodyShort>
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
                                        <Table.Body>
                                            {alleGebyrRoller.map((gebyrRolle) => (
                                                <GebyrRolleRad key={gebyrRolle.rolle.id} gebyrRolle={gebyrRolle} />
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            );
                        })}
                    </div>
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
};
