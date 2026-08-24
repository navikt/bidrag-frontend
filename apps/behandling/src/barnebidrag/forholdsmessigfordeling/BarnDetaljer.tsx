import { type ForholdsmessigFordelingBarnDto, Stonadstype } from "@bidrag/api/BidragBehandlingApiV1";
import { PersonNavnIdent } from "@bidrag/common";
import { Alert, BodyShort, Box, HGrid, HStack, Label, VStack } from "@navikt/ds-react";
import BehandlingLenke from "../../common/components/BehandlingLenke";
import { PopoverMonthPicker } from "../../common/components/date-picker/PopoverMonthPicker";
import SakLenke from "../../common/components/SakLenke";
import Søknadslenke from "../../common/components/Søknadslenke";
import { useGetBehandlingV2, useGetForholdsmessigFordelingDetaljer } from "../../common/hooks/useApiData";
import { hentVisningsnavn } from "../../common/hooks/useVisningsnavn";
import {
    addMonthsIgnoreDay,
    DateToDDMMYYYYString,
    DateToMMYYYYString,
    dateOrNull,
    toISODateString,
} from "../../utils/date-utils";
import LøpendeBidragListe from "./LøpendeBidragListe";

interface BarnDetaljerFFProps {
    barn: ForholdsmessigFordelingBarnDto[];
}

interface BarnDetaljerOpprettFFProps {
    barn: ForholdsmessigFordelingBarnDto[];
    manueltOverstyrteRevurderingsdatoer?: Record<string, string | undefined>;
    onManueltOverstyrtRevurderingsdatoChange?: (ident: string, dato?: string) => void;
}

const defaultRevurderingsdatoNesteMaaned = addMonthsIgnoreDay(new Date(), 1);

const erDefaultRevurderingsdato = (dato?: Date) => {
    if (!dato) {
        return true;
    }
    return (
        dato.getFullYear() === defaultRevurderingsdatoNesteMaaned.getFullYear() &&
        dato.getMonth() === defaultRevurderingsdatoNesteMaaned.getMonth()
    );
};

function BarnRevurderingsMonthPicker({
    ident,
    selectedDato,
    onChange,
}: {
    ident: string;
    selectedDato?: string;
    onChange?: (ident: string, dato?: string) => void;
}) {
    const { søktFomDato } = useGetBehandlingV2();
    const aktivDato = selectedDato ? new Date(selectedDato) : defaultRevurderingsdatoNesteMaaned;

    const handleMonthChange = (dato: Date | undefined) => {
        if (!onChange) {
            return;
        }
        if (erDefaultRevurderingsdato(dato ?? undefined)) {
            onChange(ident, undefined);
            return;
        }
        onChange(ident, toISODateString(dato ?? undefined) ?? undefined);
    };

    return (
        <VStack gap="space-2" className="pt-1">
            <PopoverMonthPicker
                label="Manuelt overstyr revurderingsdato"
                value={DateToDDMMYYYYString(aktivDato)}
                onChange={handleMonthChange}
                defaultSelected={aktivDato}
                fromDate={dateOrNull(søktFomDato) ?? undefined}
                toDate={addMonthsIgnoreDay(new Date(), 1)}
                inputFormat="dd.MM.yyyy"
                size="small"
            />
        </VStack>
    );
}

export function BarnDetaljerOpprettFF({
    barn,
    manueltOverstyrteRevurderingsdatoer,
    onManueltOverstyrtRevurderingsdatoChange,
}: BarnDetaljerOpprettFFProps) {
    if (barn.length === 0) return null;
    const { stønadstype, roller } = useGetBehandlingV2();
    const saksnr = barn[0].saksnr;
    const bidragsmottaker = barn[0].bidragsmottaker;
    const enhet = barn[0].enhet;
    const alleBarnErISøknaden = barn.every((b) =>
        roller.some((rb) => rb.ident === b.ident && rb.stønadstype === b.stønadstype),
    );
    function renderInnkreving(barn: ForholdsmessigFordelingBarnDto) {
        const medInnkreving = barn.åpneBehandlinger.some((b) => b.medInnkreving);
        if (medInnkreving && !barn.innkrevesFraDato) {
            return <BodyShort size="small">Ja</BodyShort>;
        }
        if ((barn.åpneBehandlinger.length === 0 || medInnkreving) && barn.innkrevesFraDato) {
            return <BodyShort size="small">Ja, fra {DateToMMYYYYString(dateOrNull(barn.innkrevesFraDato))}</BodyShort>;
        }
        if (barn.harLøpendeBidrag) {
            return <BodyShort size="small">Ja</BodyShort>;
        }
        return <BodyShort size="small">Nei</BodyShort>;
    }

    function renderÅpenBehandling(barn: ForholdsmessigFordelingBarnDto) {
        let link = null;
        let behandlingstype = null;
        const åpneBehandling = barn.åpneBehandlinger.map((b, index) => {
            if (b?.behandlingId) {
                link = <BehandlingLenke saksnummer={barn.saksnr} id={b.behandlingId} />;
                behandlingstype = hentVisningsnavn(b.behandlingstype);
            } else if (b?.søknadsid) {
                link = <Søknadslenke id={b.søknadsid} saksnr={saksnr} />;
                behandlingstype = hentVisningsnavn(b.behandlingstype);
            }
            return (
                <BodyShort size="small" key={b?.behandlingId + b?.søknadsid + index}>
                    {behandlingstype ? ` ${behandlingstype?.toLowerCase()}` : " "} {link}{" "}
                </BodyShort>
            );
        });
        return åpneBehandling.length > 0 ? (
            <HStack gap="space-2" className="items-center">
                <BodyShort size="small">Ja,</BodyShort> {åpneBehandling}
            </HStack>
        ) : (
            <BodyShort size="small">Nei</BodyShort>
        );
    }

    const detaljer = useGetForholdsmessigFordelingDetaljer();

    return (
        <Box
            background="neutral-soft"
            borderColor="brand-blue"
            padding="space-8"
            borderWidth="1"
            borderRadius="4"
            className="shadow-sm"
        >
            {!saksnr && (
                <Alert variant="warning" size="small" inline className="mb-2">
                    Ingen bidragssak funnet for barnet. Legg til eksisterende eller opprett bidragssak for å opprette FF
                </Alert>
            )}
            {(saksnr || bidragsmottaker.ident) && (
                <Box padding="space-6" background="default" className="mb-2" borderRadius="2">
                    <HStack gap="space-4" align="center">
                        {saksnr && (
                            <div>
                                <Label size="small">Sak / Enhet</Label>
                                <BodyShort size="small">
                                    <SakLenke saksnummer={saksnr} /> / {enhet}
                                </BodyShort>
                            </div>
                        )}
                        {bidragsmottaker.ident && (
                            <div>
                                <Label size="small">Bidragsmottaker</Label>
                                <BodyShort size="small">
                                    <PersonNavnIdent ident={bidragsmottaker.ident} variant="compact" />
                                </BodyShort>
                            </div>
                        )}
                    </HStack>
                </Box>
            )}
            {barn.map((barn, index) => {
                const beregningBarn = detaljer.løpendeBidragBarn?.find(
                    (b) => b.gjelderBarnIdent === barn.ident && b.gjelderStønadstype === barn.stønadstype,
                );
                return (
                    <Box
                        key={barn.ident + index}
                        padding="space-1"
                        className={!alleBarnErISøknaden ? "border-t border-ax-border-neutral-subtle" : ""}
                    >
                        {!alleBarnErISøknaden && index > 0 && (
                            <hr className="my-1 border-t border-ax-border-neutral-subtle" />
                        )}
                        <BodyShort size="small" className="ml-[-2px] font-semibold">
                            <PersonNavnIdent ident={barn.ident} variant="compact" />
                        </BodyShort>
                        {!alleBarnErISøknaden &&
                            renderIkkeAlleBarnISøknaden(stønadstype, barn, renderInnkreving, renderÅpenBehandling)}
                        {barn.erRevurdering && (
                            <BarnRevurderingsMonthPicker
                                ident={`${barn.ident}|${barn.stønadstype}`}
                                selectedDato={
                                    manueltOverstyrteRevurderingsdatoer?.[`${barn.ident}|${barn.stønadstype}`]
                                }
                                onChange={onManueltOverstyrtRevurderingsdatoChange}
                            />
                        )}
                        <LøpendeBidragListe
                            løpendeBidrag={beregningBarn?.løpendeBidragPerioder ?? []}
                            harOpprettetFF={false}
                        />
                    </Box>
                );
            })}
        </Box>
    );
}
function renderIkkeAlleBarnISøknaden(
    stønadstype: Stonadstype,
    barn: ForholdsmessigFordelingBarnDto,
    renderInnkreving,
    renderÅpenBehandling,
) {
    function renderOpphør(barn: ForholdsmessigFordelingBarnDto) {
        if (barn.opphørsdato) {
            return <BodyShort size="small">{DateToMMYYYYString(dateOrNull(barn.opphørsdato))}</BodyShort>;
        }
        return null;
    }
    return (
        <HGrid gap="space-1" columns={{ xs: 1, sm: 2 }} className="mt-1">
            {stønadstype !== barn.stønadstype && barn.stønadstype && (
                <div>
                    <Label size="small">Stønad</Label>
                    <BodyShort size="small">
                        {barn.stønadstype === Stonadstype.BIDRAG18AAR ? "Bidrag 18 år" : "Bidrag"}{" "}
                    </BodyShort>
                </div>
            )}
            <div>
                <Label size="small">Innkreving</Label>
                <BodyShort size="small">{renderInnkreving(barn)} </BodyShort>
            </div>
            {barn.eldsteSøktFraDato && barn.åpneBehandlinger.length > 1 && (
                <div>
                    <Label size="small">Eldste søkt fra dato</Label>
                    <BodyShort size="small">{DateToMMYYYYString(dateOrNull(barn.eldsteSøktFraDato))}</BodyShort>
                </div>
            )}

            <div>
                <Label size="small">Har åpen behandling?</Label>
                <BodyShort size="small">{renderÅpenBehandling(barn)}</BodyShort>
            </div>
            {barn.opphørsdato && (
                <div>
                    <Label size="small">Opphør</Label>
                    <BodyShort size="small">{renderOpphør(barn)}</BodyShort>
                </div>
            )}
        </HGrid>
    );
}

export default function BarnDetaljerFF({ barn }: BarnDetaljerFFProps) {
    if (barn.length === 0) return null;
    const saksnr = barn[0].saksnr;
    const bidragsmottaker = barn[0].bidragsmottaker;
    const enhet = barn[0].enhet;
    function renderType(barn: ForholdsmessigFordelingBarnDto) {
        const åpenBehandling = barn.åpneBehandlinger.length > 0 ? barn.åpneBehandlinger[0] : null;
        if (barn.erRevurdering) {
            return (
                <BodyShort size="small">
                    Revurdering fra {DateToMMYYYYString(dateOrNull(åpenBehandling?.søktFraDato))}
                    {åpenBehandling?.søknadsid && <Søknadslenke id={åpenBehandling.søknadsid} saksnr={saksnr} />}
                </BodyShort>
            );
        }
        let behandlingerInfo = "";
        if (barn.åpneBehandlinger.length > 1) {
            behandlingerInfo = ` (${barn.åpneBehandlinger.length} behandlinger: ${barn.åpneBehandlinger.map((b) => hentVisningsnavn(b.behandlingstype)).join(", ")})`;
        }
        return <BodyShort size="small">Del av hovedbehandling{behandlingerInfo}</BodyShort>;
    }
    const detaljer = useGetForholdsmessigFordelingDetaljer();
    return (
        <Box
            background="neutral-soft"
            borderColor="brand-blue"
            padding="space-6"
            borderWidth="1"
            borderRadius="8"
            className="shadow-sm"
        >
            <Box padding="space-2" background="default" className="mb-2" borderRadius="2">
                <HStack gap="space-4" align="center">
                    <div>
                        <Label size="small">Sak / Enhet</Label>
                        <BodyShort size="small">
                            <SakLenke saksnummer={saksnr} /> / {enhet}
                        </BodyShort>
                    </div>
                    <div>
                        <Label size="small">Bidragsmottaker</Label>
                        <BodyShort size="small">
                            <PersonNavnIdent ident={bidragsmottaker.ident} variant="compact" />
                        </BodyShort>
                    </div>
                </HStack>
            </Box>
            {barn.map((barn, index) => {
                const beregningBarn = detaljer.løpendeBidragBarn?.find(
                    (b) => b.gjelderBarnIdent === barn.ident && b.gjelderStønadstype === barn.stønadstype,
                );
                const harOpprettetFF = barn.harOpprettetForholdsmessigFordeling;
                return (
                    <Box
                        key={barn.ident + index}
                        padding="space-2"
                        className="border-t border-ax-border-neutral-subtle"
                    >
                        {index > 0 && <hr className="my-1 border-t border-ax-border-neutral-subtle" />}
                        <BodyShort size="small" className="ml-[-3px] font-semibold">
                            <PersonNavnIdent ident={barn.ident} variant="compact" />
                        </BodyShort>
                        <HGrid gap="space-2" columns={{ xs: 1, sm: 2 }} className="mt-1">
                            {barn.stønadstype === Stonadstype.BIDRAG18AAR && (
                                <div>
                                    <Label size="small">Gjelder</Label>
                                    <BodyShort size="small">{"Bidrag 18 år"}</BodyShort>
                                </div>
                            )}
                            <div>
                                <Label size="small">Har løpende bidrag?</Label>
                                <BodyShort size="small">{barn.harLøpendeBidrag ? "Ja" : "Nei"} </BodyShort>
                            </div>
                            {barn.eldsteSøktFraDato && barn.åpneBehandlinger.length > 1 && (
                                <div>
                                    <Label size="small">Senest søkt fra dato</Label>
                                    <BodyShort size="small">
                                        {DateToMMYYYYString(dateOrNull(barn.eldsteSøktFraDato))}
                                    </BodyShort>
                                </div>
                            )}
                            <div>
                                <Label size="small">Søknad</Label>
                                <BodyShort size="small">{renderType(barn)}</BodyShort>
                            </div>
                        </HGrid>
                        <LøpendeBidragListe
                            løpendeBidrag={beregningBarn?.løpendeBidragPerioder ?? []}
                            harOpprettetFF={harOpprettetFF}
                        />
                    </Box>
                );
            })}
        </Box>
    );
}
