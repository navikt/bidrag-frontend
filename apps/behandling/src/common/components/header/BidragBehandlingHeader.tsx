import { type RolleDto, TypeBehandling } from "@bidrag/api/BidragBehandlingApiV1";
import { SakHeader } from "@bidrag/common";
import { BodyShort } from "@navikt/ds-react";
import type React from "react";
import { memo, useEffect, useMemo } from "react";
import { updateUrlSearchParam } from "../../../utils/window-utils";
import text from "../../constants/texts";
import { toRolleDetaljer, useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2, usePersonsQueries } from "../../hooks/useApiData";

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

type HeaderRolle = RolleDto & { visningsnavn?: string };

const HeaderTittel = ({ type, style }: { type: TypeBehandling; style?: React.CSSProperties }) => {
    const { forholdsmessigFordeling } = useGetBehandlingV2();

    return (
        <BodyShort weight="semibold" style={style ?? { color: "var(--ax-text-accent-subtle)" }}>
            {forholdsmessigFordeling ? "Forholdsmessig fordeling" : behandlingTypeTextMapper[type]}
        </BodyShort>
    );
};

export const Header = memo(() => {
    const { behandlingId, vedtakId, selectedSaksnummer, setSelectedSaksnummer, setSelectedRoller } =
        useBehandlingProvider();
    const { roller, type, saksnummer } = useGetBehandlingV2();
    const personsQueries = usePersonsQueries(roller);

    const rollerMedPersonNavn: HeaderRolle[] = useMemo(
        () =>
            roller.map((rolle, index) => {
                const person = personsQueries[index]?.data;
                return {
                    ...rolle,
                    // Behandling har alltid ett saksnummer (i motsetning til web-appens SakHeader,
                    // som kan vise flere saker for samme person) - hentes fra behandlingen, ikke fra URL.
                    saksnummer: rolle.saksnummer ?? saksnummer,
                    visningsnavn: person?.visningsnavn ?? rolle.navn ?? "Ukjent",
                };
            }),
        [roller, personsQueries, saksnummer],
    );

    useEffect(() => {
        updateUrlSearchParam(
            "page",
            vedtakId != null
                ? `Vedtak ${behandlingTypeTitleMapper[type]} - ${vedtakId}`
                : `${behandlingTypeTitleMapper[type]} - ${behandlingId}`,
        );
    }, [behandlingId, vedtakId, type]);

    return (
        <SakHeader
            rollerMedPersonNavn={rollerMedPersonNavn}
            type={type}
            selectedSaksnummer={selectedSaksnummer}
            setSelectedSaksnummer={setSelectedSaksnummer}
            setSelectedRoller={(valgteRoller: HeaderRolle[]) => setSelectedRoller(valgteRoller.map(toRolleDetaljer))}
            HeaderTittel={HeaderTittel}
        />
    );
});

export const BidragBehandlingHeader = () => <Header />;
