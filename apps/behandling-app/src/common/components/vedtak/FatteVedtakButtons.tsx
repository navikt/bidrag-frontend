import {
    type FatteVedtakFeil,
    type FatteVedtakRevurderingsbarn,
    TypeBehandling,
    Vedtakstype,
} from "@bidrag/api/BidragBehandlingApiV1";
import { Alert, BodyShort, Button, Checkbox, CheckboxGroup, Heading, Select } from "@navikt/ds-react";
import { useIsMutating, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import debounce from "lodash/debounce";
import { useState } from "react";
import { useParams } from "react-router";
import { useVedtakProvider } from "../../../barnebidrag/components/vedtak/VedtakCommon";
import environment from "../../../environment";
import { BEHANDLING_API_V1 } from "../../constants/api";
import { MåBekrefteOpplysningerStemmerError } from "../../constants/MåBekrefteOpplysningerStemmerError";
import tekster from "../../constants/texts";
import { useBehandlingProvider } from "../../context/BehandlingContext";
import { useGetBehandlingV2 } from "../../hooks/useApiData";
import { useQueryParams } from "../../hooks/useQueryParams";
import { FlexRow } from "../layout/grid/FlexRow";
import NotatButton from "../NotatButton";

const utsettDagerListe = [3, 4, 5, 6, 7, 8, 9];
const fatteVedtakMutationKey = ["fatteVedtak"];
export const FatteVedtakButtons = ({
    isBeregningError,
    disabled = false,
    opprettesForsendelse = false,
    fatteVedtakRevurderingsbarn,
    erRevurderingsbarnOverstyringUgyldig = false,
}: {
    isBeregningError: boolean;
    disabled?: boolean;
    opprettesForsendelse?: boolean;
    fatteVedtakRevurderingsbarn?: FatteVedtakRevurderingsbarn;
    erRevurderingsbarnOverstyringUgyldig?: boolean;
}) => {
    const { skalIndeksreguleres } = useVedtakProvider();
    const [bekreftetVedtak, setBekreftetVedtak] = useState(false);
    const { behandlingId, type } = useBehandlingProvider();
    const { vedtakstype, skalInnkrevingKunneUtsettes } = useGetBehandlingV2();
    const erBarnebidrag = type === TypeBehandling.BIDRAG;
    const erAldersjustering = vedtakstype === Vedtakstype.ALDERSJUSTERING;
    const [innkrevingUtsattAntallDager, setInnkrevingUtsattAntallDager] = useState<number | null>(
        erBarnebidrag && !erAldersjustering ? 3 : null,
    );
    const isMutating = Boolean(useIsMutating({ mutationKey: fatteVedtakMutationKey }));
    const { saksnummer } = useParams<{ saksnummer?: string }>();
    const skalBekrefteNotatOpplysninger = vedtakstype !== Vedtakstype.ALDERSJUSTERING;
    const enhet = useQueryParams().get("enhet");
    const fatteVedtakFn = useMutation({
        mutationKey: fatteVedtakMutationKey,
        retry: false,
        mutationFn: async () => {
            if (!bekreftetVedtak && skalBekrefteNotatOpplysninger) {
                throw new MåBekrefteOpplysningerStemmerError();
            }

            if (erRevurderingsbarnOverstyringUgyldig) {
                throw new Error("Du må skrive en begrunnelse for å overstyre beregningen");
            }

            try {
                const request = {
                    innkrevingUtsattAntallDager,
                    enhet,
                    skalIndeksreguleres: skalIndeksreguleres as unknown as Record<string, boolean>,
                    fatteVedtakRevurderingsbarn,
                };
                return await BEHANDLING_API_V1.api.fatteVedtak(Number(behandlingId), request);
            } catch (error) {
                if (error instanceof AxiosError && error.response.status === 400) {
                    if (error.response?.data) {
                        const data = error.response.data as FatteVedtakFeil;
                        throw {
                            message: data.feilmelding,
                            cause: data,
                        };
                    }
                }
                throw new Error("Ukjent feil ved fatting av vedtak", { cause: error });
            }
        },
        onSuccess: () => {
            window.location.href = `${environment.url.bisysSakshistorikk}?saksnr=${saksnummer}`;
        },
    });
    const throttledSubmit = debounce(fatteVedtakFn.mutate, 100);

    const måBekrefteAtOpplysningerStemmerFeil =
        fatteVedtakFn.isError && fatteVedtakFn.error instanceof MåBekrefteOpplysningerStemmerError;

    return (
        <div>
            {skalInnkrevingKunneUtsettes && (
                <Select
                    size="small"
                    onChange={(e) =>
                        setInnkrevingUtsattAntallDager(e.target.value === "" ? null : Number(e.target.value))
                    }
                    defaultValue={innkrevingUtsattAntallDager}
                    label="Utsett overføring til regnskap"
                    className="w-max pb-2"
                >
                    <option value="">Ikke utsett</option>
                    {utsettDagerListe.map((dager, index) => (
                        <option value={dager} key={dager + "-" + index}>
                            {dager} dager
                        </option>
                    ))}
                </Select>
            )}
            {skalBekrefteNotatOpplysninger && (
                <Alert
                    className="pb-2 mb-2"
                    variant={måBekrefteAtOpplysningerStemmerFeil ? "error" : bekreftetVedtak ? "success" : "warning"}
                >
                    <Heading spacing level="2" size="xsmall">
                        {tekster.title.sjekkNotatOgOpplysninger}
                    </Heading>
                    <div className="text-wrap">
                        {tekster.varsel.vedtakNotat} <NotatButton />
                    </div>
                    <CheckboxGroup
                        legend=""
                        hideLegend
                        error={
                            måBekrefteAtOpplysningerStemmerFeil ? "Du må bekrefte at opplysningene stemmer" : undefined
                        }
                    >
                        <Checkbox
                            checked={bekreftetVedtak}
                            error={måBekrefteAtOpplysningerStemmerFeil}
                            onChange={() => {
                                setBekreftetVedtak((x) => !x);
                                fatteVedtakFn.reset();
                            }}
                        >
                            {tekster.varsel.bekreftFatteVedtak}
                        </Checkbox>
                    </CheckboxGroup>
                </Alert>
            )}
            {fatteVedtakFn.isError && !måBekrefteAtOpplysningerStemmerFeil && (
                <Alert variant="error" className="mt-2 mb-2">
                    <Heading spacing size="small" level="3">
                        {tekster.error.kunneIkkFatteVedtak}
                    </Heading>
                    <BodyShort>{fatteVedtakFn.error?.message || tekster.error.fatteVedtak}</BodyShort>
                </Alert>
            )}
            {fatteVedtakFn.isSuccess && (
                <Alert variant="success" size="small" className={"mt-2 mb-2"}>
                    <Heading size="small" level="3">
                        {tekster.title.vedtakFattet}
                    </Heading>
                    <BodyShort>
                        {opprettesForsendelse
                            ? tekster.varsel.vedtakFattetUtenNotatDistribuert
                            : erAldersjustering
                              ? tekster.varsel.vedtakFattetAvvistUtenNotatForsendelse
                              : tekster.varsel.vedtakFattet}
                    </BodyShort>
                </Alert>
            )}
            <FlexRow>
                <Button
                    loading={fatteVedtakFn.isPending}
                    disabled={isBeregningError || fatteVedtakFn.isSuccess || disabled || isMutating}
                    onClick={() => throttledSubmit()}
                    className="w-max"
                    size="small"
                >
                    {opprettesForsendelse
                        ? tekster.label.fatteVedtakOgSendForsendelseButton
                        : tekster.label.fatteVedtakButton}
                </Button>
            </FlexRow>
        </div>
    );
};
