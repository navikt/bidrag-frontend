import { Rolletype } from "@bidrag/api/SakApi";
import { LoggerService, PersonNavnIdent, RolleTag } from "@bidrag/common";
import { Alert, BodyShort, Button, Checkbox, CheckboxGroup, Heading, HGrid, Modal } from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { calculateAge } from "../../../utils/date-utils";
import { SAK_API } from "../../constants/api";
import { MåBekrefteOpplysningerStemmerError } from "../../constants/MåBekrefteOpplysningerStemmerError";
import { sortBehandlingRoller } from "../../helpers/behandlingRoller";
import { tilRolleType } from "../../helpers/rolletypeHelpers";
import { useGetSakerForBp, useHentPersonData, useRefetchFFInfoFn } from "../../hooks/useApiData";
import SakTableMotsattRolle from "./SakTableMotsattRolle";
import SelectSakCheckbox from "./SelectSakCheckbox";
import { KategoriNavnDisplayValue, type Sak, SakStatusDisplayValue } from "./sak";
import TableInternal, { type ColumnData, type RowData } from "./Table";

interface SakstilknytningTableProps {
    gjelderBarnIdent: string;
    onClose: () => void;
}
const columns: ColumnData[] = [{ label: "" }, { label: "Sak" }, { label: "Motpart" }, { label: "Enhet" }];

export function SakstilknytningModal({ gjelderBarnIdent }: { gjelderBarnIdent: string }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <>
            <Button size="xsmall" variant="secondary" onClick={() => setIsOpen(true)}>
                Knytt til eksisterende sak
            </Button>
            <Modal open={isOpen} onClose={() => setIsOpen(false)} aria-label="Koble til sak" className="max-w-max">
                <Modal.Header>Knytt til eksisterende sak</Modal.Header>
                <Modal.Body>
                    <SakstilknytningTable gjelderBarnIdent={gjelderBarnIdent} onClose={() => setIsOpen(false)} />
                </Modal.Body>
            </Modal>
        </>
    );
}
export default function SakstilknytningTable({ gjelderBarnIdent, onClose }: SakstilknytningTableProps) {
    const [oppdaterSak, setOppdaterSak] = React.useState<Sak>();
    const [bekreftetSakstilknytning, setBekreftetSakstilknytning] = useState(false);
    const saker = useGetSakerForBp(gjelderBarnIdent);
    const person = useHentPersonData(gjelderBarnIdent)?.data;
    const refetchFFInfo = useRefetchFFInfoFn(true);
    const leggTilSakFn = useMutation({
        retry: false,
        mutationFn: async () => {
            if (!oppdaterSak) {
                throw new Error("Du må velge en sak før du kan legge den til");
            }
            if (!bekreftetSakstilknytning) {
                throw new MåBekrefteOpplysningerStemmerError();
            }
            try {
                const erBarnOver18År = person?.fødselsdato && calculateAge(person?.fødselsdato) >= 18;
                const oppdatertSak = await SAK_API.sak.oppdaterSakRoller({
                    saksnummer: oppdaterSak.saksnummer,
                    roller: [
                        {
                            rolleType: Rolletype.BA,
                            type: Rolletype.BA,
                            fodselsnummer: gjelderBarnIdent,
                            mottagerErVerge: false,
                            rollehistorikk: [],
                            reellMottaker: erBarnOver18År ? null : { ident: gjelderBarnIdent, verge: false },
                        },
                    ],
                });
                console.log("oppdatertSak med roller", oppdatertSak);
            } catch (e) {
                LoggerService.error("Feil ved oppdatering av sak", e);
            }
        },
        onSuccess: () => {
            onClose();
            refetchFFInfo();
        },
    });
    const måBekrefteAtOpplysningerStemmerFeil =
        leggTilSakFn.isError && leggTilSakFn.error instanceof MåBekrefteOpplysningerStemmerError;
    function BekreftKnyttTilSak() {
        if (!oppdaterSak) return null;
        return (
            <Alert
                size="small"
                className="pt-2 mt-2 mb-2 pb-2"
                variant={
                    måBekrefteAtOpplysningerStemmerFeil ? "error" : bekreftetSakstilknytning ? "success" : "warning"
                }
            >
                <Heading spacing level="2" size="xsmall">
                    Bekreft at barnet skal tilknyttes sak {oppdaterSak.saksnummer}
                </Heading>
                <BodyShort
                    size="small"
                    className="mb-4 [&>span]:inline-flex [&>span]:relative [&>span]:top-[6px] [&>span]:right-[3px]"
                >
                    <PersonNavnIdent ident={gjelderBarnIdent} variant="compact" />
                    vil bli knyttet til sak {oppdaterSak.saksnummer}. Ved å bekrefte at barnet skal tilknyttes valgt
                    sak, godkjenner du barnet tilhører saken og bidragsmottaker{" "}
                    <PersonNavnIdent ident={oppdaterSak.motsattRolle.fodselsnummer} variant="compact" />.
                </BodyShort>

                <CheckboxGroup
                    legend=""
                    hideLegend
                    error={
                        måBekrefteAtOpplysningerStemmerFeil
                            ? "Du må bekrefte at barnet skal tilknyttes valgt sak"
                            : undefined
                    }
                >
                    <Checkbox
                        checked={bekreftetSakstilknytning}
                        error={måBekrefteAtOpplysningerStemmerFeil}
                        onChange={() => {
                            setBekreftetSakstilknytning((x) => !x);
                            leggTilSakFn.reset();
                        }}
                    >
                        Jeg bekrefter at barnet skal tilknyttes valgt sak
                    </Checkbox>
                </CheckboxGroup>
            </Alert>
        );
    }

    function renderTable() {
        if (saker.length === 0) {
            return (
                <Alert variant="info" size="small" inline className={"no-sak-alert"}>
                    Bidragspliktig har ingen tilknyttede saker
                </Alert>
            );
        }
        return (
            <CheckboxGroup error={leggTilSakFn.error?.message} legend="" hideLegend>
                <TableInternal
                    id={"sakstilknytningTable"}
                    columns={columns}
                    rows={(row) => createRow(row, setOppdaterSak, oppdaterSak)}
                    data={saker}
                    expandableContent={RollerExpandableContent}
                />
            </CheckboxGroup>
        );
    }

    return (
        <div>
            {leggTilSakFn.error?.message && !måBekrefteAtOpplysningerStemmerFeil && (
                <Alert variant="error" size="small">
                    {`Det skjedde en feil ved registrering av sak: ${leggTilSakFn.error.message}`}
                </Alert>
            )}
            {renderTable()}
            <BekreftKnyttTilSak />
            <Modal.Footer>
                <Button
                    variant="primary"
                    size="xsmall"
                    onClick={() => {
                        leggTilSakFn.mutate();
                    }}
                    disabled={!oppdaterSak}
                >
                    Knytt barn til valgt sak
                </Button>
                <Button variant="secondary" size="xsmall" onClick={onClose}>
                    Avbryt
                </Button>
            </Modal.Footer>
        </div>
    );
}

function RollerExpandableContent(sak: Sak) {
    const finnesRm = sak.roller.some((rolle) => rolle.reellMottaker !== null && rolle.reellMottaker !== undefined);
    return (
        <div className="flex flex-col gap-2">
            <Heading size="xsmall" className="mb-4">
                Roller i sak
            </Heading>
            <HGrid className="w-max" gap={"space-4"} columns={2}>
                {sak.roller
                    .filter((rolle) => rolle.type !== Rolletype.FR && rolle.type !== Rolletype.RM)
                    .sort(sortBehandlingRoller)
                    .map((rolle) => (
                        <div className={`flex flex-col gap-2 `} key={rolle.fodselsnummer}>
                            <div className="w-full inline-flex ">
                                <PersonNavnIdent rolle={tilRolleType(rolle.type)} ident={rolle.fodselsnummer} />
                            </div>
                            {finnesRm && rolle.type === Rolletype.BA ? (
                                rolle.reellMottaker ? (
                                    <div className="ml-[0.5em] text-slate-500">
                                        <PersonNavnIdent
                                            rolle={tilRolleType(Rolletype.RM)}
                                            ident={rolle.reellMottaker.ident}
                                        />
                                        {rolle.reellMottaker.verge && (
                                            <>
                                                <span className="mx-1">/</span>
                                                <span className="personident">{"Verge"}</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ml-[0.5em] text-slate-500">
                                        <RolleTag rolleType={tilRolleType(Rolletype.RM)} />
                                        <span className="ml-2 personnavn">Ingen reell mottaker</span>
                                    </div>
                                )
                            ) : null}
                        </div>
                    ))}
            </HGrid>
        </div>
    );
}

function createRow(sak: Sak, setRegistrerSak: (saksnummer: Sak) => void, registrerSak?: Sak): RowData {
    const isSelected = registrerSak?.saksnummer === sak.saksnummer;

    return {
        components: [
            {
                content: <SelectSakCheckbox sak={sak} isSelected={isSelected} onChecked={() => setRegistrerSak(sak)} />,
                className: "row-checbox",
                width: "1",
            },
            {
                content: (
                    <>
                        {sak.saksnummer && (
                            <span className="inline [&__p]:inline">
                                {/* [&__p]:inline */}
                                <p className="inline">{sak.saksnummer}</p>
                                <RolleTag rolleType={tilRolleType(sak.rolle?.type)} />
                            </span>
                        )}
                        <p> {KategoriNavnDisplayValue[sak.kategori]}</p>
                        <p>{SakStatusDisplayValue[sak.saksstatus]}</p>
                    </>
                ),
            },
            {
                content: <SakTableMotsattRolle sak={sak} />,
            },
            {
                content: (
                    <BodyShort size="small">
                        <div>{sak.eierfogd}</div>
                        <div>{sak.enhetInformasjon ?? "Fant ikke enhetsnavn"}</div>
                    </BodyShort>
                ),
            },
        ],
        isSelected: isSelected,
    };
}
