import { Rolletype } from "@bidrag/api/SakApi";
import { PersonNavnIdent } from "@bidrag/common";
import { PlusIcon as Add } from "@navikt/aksel-icons";
import { Alert, CheckboxGroup, Heading, HGrid } from "@navikt/ds-react";
import React from "react";
import { NY_SAK_SAKSNUMMER, type Sak } from "../../../types/sak";
import IkonKnapp from "../icons/IkonKnapp";
import RolleTag from "../person/RolleTag";
import TableInternal, { type ColumnData, type RowData } from "./Table";

interface SakstilknytningTableProps {
    columns: ColumnData[];
    createRow: (sak: Sak) => RowData;
    saker: Sak[];
    errorMessage?: string;
    onNySakButtonClicked?: () => void;
}

export default function SakstilknytningTable({
    saker,
    columns,
    createRow,
    errorMessage,
    onNySakButtonClicked,
}: SakstilknytningTableProps) {
    function renderTable() {
        if (saker.length === 0) {
            return (
                <>
                    <Alert variant="info" inline className={"no-sak-alert"}>
                        Bruker har ingen tilknyttede saker
                    </Alert>
                    {errorMessage && (
                        <Alert variant="error" size="small">
                            {errorMessage}
                        </Alert>
                    )}
                </>
            );
        }
        return (
            <CheckboxGroup error={errorMessage} legend="" hideLegend>
                <TableInternal
                    id={"sakstilknytningTable"}
                    columns={columns}
                    rows={createRow}
                    data={saker}
                    expandableContent={RollerExpandableContent}
                />
            </CheckboxGroup>
        );
    }

    return (
        <>
            {renderTable()}
            {onNySakButtonClicked && (
                <IkonKnapp
                    ikonElement={<Add />}
                    tekst={"Ny sak"}
                    id={"ny-sak-knapp"}
                    className={"ny-sak-button"}
                    disabled={saker.some((sak) => sak.saksnummer === NY_SAK_SAKSNUMMER)}
                    onClick={onNySakButtonClicked}
                />
            )}
        </>
    );
}

function RollerExpandableContent(sak: Sak) {
    const finnesRm = sak.roller.some((rolle) => rolle.reellMottaker !== null && rolle.reellMottaker !== undefined);
    return (
        <div className="flex flex-col gap-2">
            <Heading size="xsmall" className="mb-4">
                Roller i sak
            </Heading>
            <HGrid className="w-max" gap={"space-6"} columns={2}>
                {sak.roller
                    .filter((rolle) => rolle.rolleType != Rolletype.FR && rolle.rolleType != Rolletype.RM)
                    .sort((a, b) => {
                        if (a.rolleType == Rolletype.BA && b.rolleType != Rolletype.BA) {
                            return 1;
                        }
                        if (a.rolleType == Rolletype.BA && b.rolleType == Rolletype.BA) {
                            return b.foedselsnummer.localeCompare(a.foedselsnummer);
                        }
                        return -1;
                    })
                    .map((rolle) => (
                        <div className={`flex flex-col gap-2 `} key={rolle.foedselsnummer}>
                            <div className="w-full inline-flex ">
                                <PersonNavnIdent
                                    rolle={rolle.rolleType as unknown as import("@bidrag/common").RolleType}
                                    ident={rolle.foedselsnummer}
                                />
                            </div>
                            {finnesRm && rolle.rolleType == Rolletype.BA ? (
                                rolle.reellMottaker ? (
                                    <div className="ml-[0.5em] text-slate-500">
                                        <PersonNavnIdent
                                            rolle={Rolletype.RM as unknown as import("@bidrag/common").RolleType}
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
                                        <RolleTag rolleType={Rolletype.RM} />
                                        <span className="ml-2 personnavn">Ingen reell mottaker</span>
                                    </div>
                                )
                            ) : (
                                <></>
                            )}
                        </div>
                    ))}
            </HGrid>
        </div>
    );
}
