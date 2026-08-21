import { type RolleDto, Rolletype, Stonadstype, TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { type IRolleDetaljer, RolleCard, type RolleTypeAbbreviation, SakHeader } from "@bidrag/common";
import { ChevronDownIcon, ChevronUpIcon } from "@navikt/aksel-icons";
import { BodyShort, Box, CopyButton } from "@navikt/ds-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateUrlSearchParam } from "../../../utils/window-utils";
import text from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2, usePersonsQueries } from "../../hooks/useApiData";
import useFeatureToogle from "../../hooks/useFeatureToggle";

const behandlingTypeTextMapper = {
    [TypeBehandling.FORSKUDD]: text.skjermbildeNavn.forskudd,
    [TypeBehandling.SAeRBIDRAG]: text.skjermbildeNavn.særbidrag,
    [TypeBehandling.BIDRAG]: text.skjermbildeNavn.bidrag,
};

const behandlingTypeTitleMapper = {
    [TypeBehandling.FORSKUDD]: text.skjermbildeTittel.forskudd,
    [TypeBehandling.SAeRBIDRAG]: text.skjermbildeTittel.særbidrag,
    [TypeBehandling.BIDRAG]: text.skjermbildeTittel.bidrag,
};

type HeaderRolle = RolleDto & { visningsnavn: string };

type SaksnummerRoller = {
    saksnummer: string;
    roller: IRolleDetaljer[];
};

const mapToRolleDetaljer = (rolle: HeaderRolle): IRolleDetaljer => ({
    ...rolle,
    stønad18År: rolle.stønadstype === Stonadstype.BIDRAG18AAR,
    navn: rolle.visningsnavn,
    ident: rolle.ident!,
    rolleType: rolle.rolletype as unknown as RolleTypeAbbreviation,
});

const getRolleSortWeight = (rolle: HeaderRolle) => {
    if (rolle.rolletype === Rolletype.BM) {
        return 0;
    }
    if (rolle.rolletype === Rolletype.BP) {
        return 1;
    }
    return rolle.erRevurdering ? 3 : 2;
};

const compareRoller = (a: HeaderRolle, b: HeaderRolle) => {
    const weightDiff = getRolleSortWeight(a) - getRolleSortWeight(b);
    if (weightDiff !== 0) {
        return weightDiff;
    }

    if (
        a.rolletype !== Rolletype.BM &&
        a.rolletype !== Rolletype.BP &&
        b.rolletype !== Rolletype.BM &&
        b.rolletype !== Rolletype.BP
    ) {
        const alderA = a.fødselsdato ? new Date(a.fødselsdato).getTime() : Number.POSITIVE_INFINITY;
        const alderB = b.fødselsdato ? new Date(b.fødselsdato).getTime() : Number.POSITIVE_INFINITY;
        if (alderA !== alderB) {
            return alderA - alderB;
        }
    }

    return a.id - b.id;
};

const dedupeRoller = (roller: HeaderRolle[]) => {
    const rolleMap = new Map<number, IRolleDetaljer>();
    roller.sort(compareRoller).forEach((rolle) => {
        rolleMap.set(rolle.id, mapToRolleDetaljer(rolle));
    });
    return Array.from(rolleMap.values());
};

const mapSaksnummerRoller = (roller: HeaderRolle[]): SaksnummerRoller[] => {
    const saksnummerOrder = Array.from(new Set(roller.map((rolle) => rolle.saksnummer)));
    const bpRoller = roller.filter((rolle) => rolle.rolletype === Rolletype.BP);

    return saksnummerOrder.map((saksnummer) => {
        const rollerISak = roller.filter(
            (rolle) => rolle.saksnummer === saksnummer && rolle.rolletype !== Rolletype.BP,
        );
        console.log("bpRoller", bpRoller, rollerISak);
        return {
            saksnummer,
            roller: dedupeRoller([...rollerISak, ...bpRoller].sort(compareRoller)),
        };
    });
};

const sammeRoller = (a: IRolleDetaljer[], b: IRolleDetaljer[]) =>
    a.length === b.length && a.every((rolle) => b.some((annenRolle) => annenRolle.id === rolle.id));

const HeaderTittel = ({ type, style }: { type: TypeBehandling; style?: React.CSSProperties }) => {
    const { forholdsmessigFordeling } = useGetBehandlingV2();

    return (
        <BodyShort weight="semibold" style={style ?? { color: "var(--ax-text-accent-subtle)" }}>
            {forholdsmessigFordeling ? "Forholdsmessig fordeling" : behandlingTypeTextMapper[type]}
        </BodyShort>
    );
};

const OldHeader = ({
    rollerMedPersonNavn,
    saksnummer,
    behandlingId,
    vedtakId,
    type,
}: {
    rollerMedPersonNavn: HeaderRolle[];
    saksnummer: string;
    behandlingId: string;
    vedtakId: string;
    type: TypeBehandling;
}) => {
    return (
        <SakHeader
            saksnummer={saksnummer}
            roller={rollerMedPersonNavn.map(mapToRolleDetaljer)}
            skjermbilde={{ navn: behandlingTypeTextMapper[type], referanse: `${behandlingId ?? vedtakId}` }}
        />
    );
};

const NewHeader = ({ rollerMedPersonNavn, type }: { rollerMedPersonNavn: HeaderRolle[]; type: TypeBehandling }) => {
    const { selectedSaksnummer, setSelectedSaksnummer, setSelectedRoller } = useBehandlingProvider();

    const saksnummerRoller = useMemo(() => mapSaksnummerRoller(rollerMedPersonNavn), [rollerMedPersonNavn]);
    const harFlereSaksnummer = saksnummerRoller.length > 1;

    const aktivtSaksnummer = useMemo(() => {
        if (saksnummerRoller.length === 0) return undefined;
        if (!harFlereSaksnummer) return saksnummerRoller[0].saksnummer;
        if (
            selectedSaksnummer &&
            saksnummerRoller.some((saksnummerRolle) => saksnummerRolle.saksnummer === selectedSaksnummer)
        ) {
            return selectedSaksnummer;
        }
        return saksnummerRoller[0].saksnummer;
    }, [saksnummerRoller, harFlereSaksnummer, selectedSaksnummer]);

    const prevAktivtSaksnummerRef = useRef<string | undefined>(aktivtSaksnummer);
    const [flashingSaksnummer, setFlashingSaksnummer] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (prevAktivtSaksnummerRef.current !== aktivtSaksnummer && aktivtSaksnummer) {
            setFlashingSaksnummer(aktivtSaksnummer);
            const timer = setTimeout(() => setFlashingSaksnummer(undefined), 800);
            prevAktivtSaksnummerRef.current = aktivtSaksnummer;
            return () => clearTimeout(timer);
        }
        prevAktivtSaksnummerRef.current = aktivtSaksnummer;
    }, [aktivtSaksnummer]);

    const [expandedSaksnummer, setExpandedSaksnummer] = useState<string | undefined>(aktivtSaksnummer);

    const aktivSaksnummerRoller = useMemo(
        () => saksnummerRoller.find((saksnummerRolle) => saksnummerRolle.saksnummer === aktivtSaksnummer),
        [saksnummerRoller, aktivtSaksnummer],
    );
    const expandedSaksnummerRoller = useMemo(
        () => saksnummerRoller.find((saksnummerRolle) => saksnummerRolle.saksnummer === expandedSaksnummer),
        [saksnummerRoller, expandedSaksnummer],
    );

    const onSelectSaksnummer = useCallback(
        (saksnummer: string) => {
            if (!harFlereSaksnummer) {
                return;
            }

            const saksnummerRolle = saksnummerRoller.find((item) => item.saksnummer === saksnummer);
            if (!saksnummerRolle) {
                return;
            }

            setSelectedSaksnummer(saksnummer);
            setSelectedRoller(saksnummerRolle.roller);
            setExpandedSaksnummer(saksnummer);
        },
        [harFlereSaksnummer, saksnummerRoller, setSelectedSaksnummer, setSelectedRoller],
    );

    const onToggleExpanded = useCallback(
        (saksnummer: string) => {
            const finnesSaksnummerRoller = saksnummerRoller.some((item) => item.saksnummer === saksnummer);
            if (!finnesSaksnummerRoller) {
                return;
            }

            setExpandedSaksnummer((currentExpanded) => (currentExpanded === saksnummer ? undefined : saksnummer));
        },
        [saksnummerRoller],
    );

    useEffect(() => {
        if (!aktivSaksnummerRoller) {
            setSelectedSaksnummer(undefined);
            setSelectedRoller([]);
            setExpandedSaksnummer(undefined);
            return;
        }

        const saksnummerSomSkalBrukes = harFlereSaksnummer
            ? aktivSaksnummerRoller.saksnummer
            : saksnummerRoller[0].saksnummer;
        setSelectedSaksnummer(saksnummerSomSkalBrukes);
        setSelectedRoller((currentRoller) => {
            if (sammeRoller(currentRoller, aktivSaksnummerRoller.roller)) {
                return currentRoller;
            }
            return aktivSaksnummerRoller.roller;
        });

        if (!harFlereSaksnummer) {
            setExpandedSaksnummer(saksnummerSomSkalBrukes);
            return;
        }

        setExpandedSaksnummer((currentExpanded) => {
            if (!currentExpanded) {
                return currentExpanded;
            }

            const finnesFortsatt = saksnummerRoller.some(
                (saksnummerRolle) => saksnummerRolle.saksnummer === currentExpanded,
            );
            return finnesFortsatt ? currentExpanded : saksnummerSomSkalBrukes;
        });
    }, [aktivSaksnummerRoller, harFlereSaksnummer, saksnummerRoller, setSelectedSaksnummer, setSelectedRoller]);

    return (
        <Box
            style={{
                background: "var(--ax-bg-neutral-soft)",
                borderBottom: "1px solid var(--ax-border-neutral-subtle)",
            }}
        >
            <style>{`
                @keyframes saksnummerFlash {
                    0%   { box-shadow: 0 0 0 3px var(--ax-border-accent, #0067c5); }
                    100% { box-shadow: 0 0 0 0px transparent; }
                }
            `}</style>
            <Box>
                <Box
                    style={{
                        display: "flex",
                        padding: "0rem 1rem",
                        background: "var(--ax-bg-neutral-soft)",
                    }}
                >
                    <Box
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                            padding: "0.5rem 1.5rem 0.5rem 0",
                        }}
                    >
                        <HeaderTittel
                            type={type}
                            style={{ color: "var(--ax-bg-brand-beige-strong)", whiteSpace: "nowrap" }}
                        />
                    </Box>
                    <Box style={{ display: "flex", minWidth: 0 }}>
                        {saksnummerRoller.map((saksnummerRolle) => {
                            const isSelected = aktivtSaksnummer === saksnummerRolle.saksnummer;
                            const isExpanded = expandedSaksnummer === saksnummerRolle.saksnummer;
                            const isFlashing = flashingSaksnummer === saksnummerRolle.saksnummer;

                            return (
                                <Box
                                    key={saksnummerRolle.saksnummer}
                                    style={
                                        isFlashing
                                            ? {
                                                  animation: "saksnummerFlash 0.8s ease-out forwards",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "0.25rem",
                                                  padding: "0.5rem 1rem",
                                                  background: isSelected
                                                      ? "var(--ax-bg-default)"
                                                      : "var(--ax-bg-neutral-soft)",
                                                  marginBottom: isSelected ? "-1px" : "0",
                                                  borderBottom: isSelected
                                                      ? "1px solid var(--ax-bg-default)"
                                                      : "1px solid transparent",
                                              }
                                            : {
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "0.25rem",
                                                  padding: "0.5rem 1rem",
                                                  background: isSelected
                                                      ? "var(--ax-bg-default)"
                                                      : "var(--ax-bg-neutral-soft)",
                                                  marginBottom: isSelected ? "-1px" : "0",
                                                  borderBottom: isSelected
                                                      ? "1px solid var(--ax-bg-default)"
                                                      : "1px solid transparent",
                                              }
                                    }
                                >
                                    <button
                                        type="button"
                                        disabled={!harFlereSaksnummer}
                                        onClick={() => onSelectSaksnummer(saksnummerRolle.saksnummer)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            whiteSpace: "nowrap",
                                            color: isSelected
                                                ? "var(--ax-text-default)"
                                                : "var(--ax-text-accent-subtle)",
                                            fontWeight: isSelected ? 600 : 400,
                                            cursor: harFlereSaksnummer ? "pointer" : "default",
                                        }}
                                    >
                                        Saksnr {saksnummerRolle.saksnummer}
                                    </button>
                                    <CopyButton
                                        size="small"
                                        copyText={saksnummerRolle.saksnummer}
                                        title="Kopier saksnummer"
                                        style={{
                                            borderRadius: 0,
                                            border: 0,
                                            background: "transparent",
                                            boxShadow: "none",
                                        }}
                                    />
                                    {isSelected && (
                                        <button
                                            type="button"
                                            onClick={() => onToggleExpanded(saksnummerRolle.saksnummer)}
                                            style={{ background: "transparent", border: 0, cursor: "pointer" }}
                                        >
                                            {isExpanded ? (
                                                <ChevronUpIcon aria-hidden />
                                            ) : (
                                                <ChevronDownIcon aria-hidden />
                                            )}
                                        </button>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {expandedSaksnummerRoller && (
                    <Box
                        style={{
                            padding: "0.75rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            background: "white",
                        }}
                        shadow="dialog"
                    >
                        {expandedSaksnummerRoller.roller.map((rolle) => (
                            <Box
                                key={rolle.id}
                                style={{
                                    border: "1px solid var(--ax-border-neutral-subtle)",
                                    borderRadius: "0.375rem",
                                    background: "var(--ax-bg-default)",
                                    margin: "0.125rem 0.375rem",
                                }}
                            >
                                <RolleCard rolle={rolle} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export const Header = memo(() => {
    const { behandlingId, vedtakId } = useBehandlingProvider();
    const { roller, type, saksnummer } = useGetBehandlingV2();
    const { nyBehandlingHeader } = useFeatureToogle();
    const personsQueries = usePersonsQueries(roller);

    const rollerMedPersonNavn = useMemo(
        () =>
            roller.map((rolle, index) => {
                const person = personsQueries[index]?.data;
                return {
                    ...rolle,
                    visningsnavn: person?.visningsnavn ?? rolle.navn ?? "Ukjent",
                };
            }),
        [roller, personsQueries],
    );

    useEffect(() => {
        updateUrlSearchParam(
            "page",
            vedtakId != null
                ? `Vedtak ${behandlingTypeTitleMapper[type]} - ${vedtakId}`
                : `${behandlingTypeTitleMapper[type]} - ${behandlingId}`,
        );
    }, [behandlingId, vedtakId, type]);

    if (nyBehandlingHeader) {
        return <NewHeader rollerMedPersonNavn={rollerMedPersonNavn} type={type} />;
    }

    return (
        <OldHeader
            rollerMedPersonNavn={rollerMedPersonNavn}
            saksnummer={saksnummer}
            behandlingId={behandlingId}
            vedtakId={vedtakId}
            type={type}
        />
    );
});

export const BidragBehandlingHeader = () => <Header />;
