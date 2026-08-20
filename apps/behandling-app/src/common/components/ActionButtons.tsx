import { Vedtakstype } from "@bidrag/api/BidragBehandlingApiV1";
import { ExternalLinkIcon } from "@navikt/aksel-icons";
import { Button, Link } from "@navikt/ds-react";
import React from "react";
import { useParams } from "react-router";
import text from "../constants/texts";
import { useBehandlingProvider } from "../context/BehandlingContext";
import { useGetBehandlingV2 } from "../hooks/useApiData";
import useFeatureToogle from "../hooks/useFeatureToggle";
import { FlexRow } from "./layout/grid/FlexRow";

export const ActionButtons = ({ onNext }: { onNext: () => void }) => {
    const { behandlingId, vedtakId, saksnummer } = useParams<{
        behandlingId?: string;
        vedtakId?: string;
        saksnummer?: string;
    }>();
    const { vedtakstype, erBisysVedtak } = useGetBehandlingV2();
    const { lesemodus } = useBehandlingProvider();
    const notatUrl = behandlingId ? `/behandling/${behandlingId}/notat` : vedtakId ? `/vedtak/${vedtakId}/notat` : "";
    const { nyToolbar } = useFeatureToogle();

    if (nyToolbar) {
        return null;
    }
    return (
        <FlexRow className="items-center">
            <Button
                type="button"
                onClick={onNext}
                variant="primary"
                iconPosition="right"
                className="w-max"
                size="small"
            >
                {text.label.gåVidere}
            </Button>
            {vedtakstype !== Vedtakstype.ALDERSJUSTERING && !lesemodus && !erBisysVedtak && (
                <Link
                    href={saksnummer ? `/sak/${saksnummer}${notatUrl}` : notatUrl}
                    target="_blank"
                    className="font-ax-bold"
                >
                    {text.label.notatButton} <ExternalLinkIcon aria-hidden />
                </Link>
            )}
        </FlexRow>
    );
};
