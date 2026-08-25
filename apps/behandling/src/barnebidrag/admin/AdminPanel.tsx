import type { FatteVedtakRevurderingsbarn } from "@bidrag/api/BidragBehandlingApiV1";
import {
    ArrowCirclepathIcon,
    CalculatorIcon,
    CogIcon,
    ExclamationmarkTriangleIcon,
    FileCheckmarkIcon,
    TrashIcon,
    XMarkIcon,
} from "@navikt/aksel-icons";
import {
    Alert,
    BodyShort,
    Box,
    Button,
    CopyButton,
    Heading,
    HStack,
    Loader,
    Modal,
    Tabs,
    VStack,
} from "@navikt/ds-react";
import { useMutation } from "@tanstack/react-query";
import JsonView from "@uiw/react-json-view";
import { lightTheme } from "@uiw/react-json-view/light";
import type React from "react";
import { useState } from "react";
import { OverstyrFatteVedtakRevurderingSwitch } from "../../common/components/vedtak/OverstyrRevurderingSwitch";
import { BEHANDLING_API_V1 } from "../../common/constants/api";
import { useBehandlingProviderExists } from "../../common/context/BehandlingContext";
import { useGetBehandlingV2, useRefetchFFInfoFn } from "../../common/hooks/useApiData";
import useFeatureToogle from "../../common/hooks/useFeatureToggle";

interface JsonViewerProps {
    data: unknown;
    maxDepth?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, maxDepth = 10 }) => {
    return (
        <Box
            background="neutral-soft"
            padding="space-4"
            borderRadius="4"
            borderWidth="1"
            borderColor="neutral-subtle"
            style={{ maxHeight: "55vh", overflow: "auto" }}
        >
            <JsonView
                value={data as object}
                style={lightTheme}
                displayDataTypes={true}
                displayObjectSize={true}
                enableClipboard={true}
                collapsed={maxDepth}
                shortenTextAfterLength={100}
            />
        </Box>
    );
};

type AdminAction = {
    key: string;
    label: string;
    icon: React.ComponentType<unknown>;
    mutation: ReturnType<typeof useMutation>;
    category: "admin" | "beregning-vedtak";
};

export const AdminPanelFloatingButton: React.FC = () => {
    const { isAdminEnabled, nyToolbar } = useFeatureToogle();
    if (!isAdminEnabled) return null;
    if (nyToolbar) return null;

    return (
        <div className="z-[10000] agroup fixed bottom-0 left-0 p-2">
            <AdminPanel />
        </div>
    );
};
export const AdminPanel: React.FC = () => {
    const providerExists = useBehandlingProviderExists();
    if (!providerExists) return null;
    const { isAdminEnabled } = useFeatureToogle();
    const behandling = useGetBehandlingV2();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [begrunnelseIkkeFatteVedtak, setBegrunnelseIkkeFatteVedtak] = useState<FatteVedtakRevurderingsbarn>();
    const [responseData, setResponseData] = useState<{ action: string; data: unknown } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const refetch = useRefetchFFInfoFn();

    const avsluttFF = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.avsluttFfSoknad(behandling.id),
        onSuccess: () => setError(null),
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const slettBehandling = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.slettBehandling(behandling.id),
        onSuccess: () => setError(null),
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const resetVedtak = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.resetFattetVedtak(behandling.id),
        onSuccess: () => setError(null),
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const resetGrunnlag = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.resetHentGrunnlag(behandling.id),
        onSuccess: () => setError(null),
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const ignoreGrunnlag = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.ignorerHentGrunnlag(behandling.id),
        onSuccess: () => setError(null),
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const opprettBeregning = useMutation({
        mutationFn: () => BEHANDLING_API_V1.api.opprettInputBeregning(behandling.id),
        onSuccess: (data) => {
            setResponseData({ action: "opprettInputBeregning", data: data.data });
            setError(null);
        },
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const opprettVedtak = useMutation({
        mutationFn: () =>
            BEHANDLING_API_V1.api.opprettFatteVedtakRequest(behandling.id, {
                fatteVedtakRevurderingsbarn: begrunnelseIkkeFatteVedtak,
            }),
        onSuccess: (data) => {
            setResponseData({ action: "opprettFatteVedtakRequest", data: data.data });
            setError(null);
        },
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });
    const oppdaterSøknadsdata = useMutation({
        mutationFn: () => Promise.resolve(refetch()),
        onSuccess: () => {
            setError(null);
        },
        onError: (err: Error) => setError(err?.message || "En feil oppstod"),
    });

    const actions: AdminAction[] = [
        {
            key: "ignore_grunnlag",
            label: "Ignorer grunnlagsinnhenting",
            icon: ExclamationmarkTriangleIcon,
            mutation: ignoreGrunnlag,
            category: "admin",
        },
        {
            key: "reset_grunnlag",
            label: "Reset grunnlagsinnhenting",
            icon: ArrowCirclepathIcon,
            mutation: resetGrunnlag,
            category: "admin",
        },
        {
            key: "reset_vedtak",
            label: "Tilbakestill behandling",
            icon: ArrowCirclepathIcon,
            mutation: resetVedtak,
            category: "admin",
        },
        {
            key: "delete",
            label: "Slett behandling",
            icon: TrashIcon,
            mutation: slettBehandling,
            category: "admin",
        },
        {
            key: "avslutt_ff",
            label: "Avslutt FF",
            icon: XMarkIcon,
            mutation: avsluttFF,
            category: "admin",
        },
        {
            key: "opprett_beregning",
            label: "Opprett input beregning",
            icon: CalculatorIcon,
            mutation: opprettBeregning,
            category: "beregning-vedtak",
        },
        {
            key: "opprett_vedtak",
            label: "Opprett fatte vedtak request",
            icon: FileCheckmarkIcon,
            mutation: opprettVedtak,
            category: "beregning-vedtak",
        },
        {
            key: "oppdater_søknadsdata",
            label: "Oppdater søknadsdata",
            icon: FileCheckmarkIcon,
            mutation: oppdaterSøknadsdata,
            category: "beregning-vedtak",
        },
    ];

    const handleAction = async (action: AdminAction) => {
        setError(null);
        setResponseData(null);
        //@ts-expect-error
        await action.mutation.mutate();
    };

    const isLoading = actions.some((action) => action.mutation.isPending);
    const adminActions = actions.filter((a) => a.category === "admin");
    const beregningVedtakActions = actions.filter((a) => a.category === "beregning-vedtak");

    if (!isAdminEnabled) return null;
    return (
        <div className="flex items-end justify-end w-max flex-row gap-[5px]">
            <Søknadsid />
            <div>
                <Button variant="tertiary" size="small" icon={<CogIcon />} onClick={() => setIsModalOpen(true)}>
                    Admin
                </Button>

                <Modal
                    open={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setError(null);
                        setResponseData(null);
                    }}
                    header={{ heading: "🛠️ Admin Panel" }}
                    className="max-h-[90vh] w-auto max-w-[900px]"
                >
                    <Modal.Body>
                        <VStack gap="space-4">
                            <Alert variant="info">Admin verktøy for testing og feilsøking.</Alert>

                            {error && (
                                <Alert variant="error">
                                    <VStack gap="space-1">
                                        <Heading spacing size="small" level="3">
                                            Feil oppstod
                                        </Heading>
                                        <BodyShort>{error}</BodyShort>
                                    </VStack>
                                </Alert>
                            )}

                            <Tabs defaultValue="generer">
                                <Tabs.List>
                                    <Tabs.Tab value="generer" label="Beregning og vedtak" />
                                    <Tabs.Tab value="behandling" label="Endre behandling" />
                                </Tabs.List>

                                <Tabs.Panel value="generer">
                                    <Box padding="space-2" marginBlock="space-2">
                                        <VStack gap="space-4">
                                            <HStack gap="space-2" wrap>
                                                {beregningVedtakActions.map((action) => (
                                                    <>
                                                        {action.key === "opprett_vedtak" && (
                                                            <OverstyrFatteVedtakRevurderingSwitch
                                                                onChange={setBegrunnelseIkkeFatteVedtak}
                                                                kanFatteVedtakForRevurderingsbarn
                                                            />
                                                        )}
                                                        <Button
                                                            key={action.key}
                                                            variant="secondary"
                                                            size="small"
                                                            icon={<action.icon />}
                                                            onClick={() => handleAction(action)}
                                                            loading={action.mutation.isPending}
                                                            disabled={isLoading && !action.mutation.isPending}
                                                        >
                                                            {action.label}
                                                        </Button>
                                                    </>
                                                ))}
                                            </HStack>
                                        </VStack>
                                    </Box>
                                </Tabs.Panel>

                                <Tabs.Panel value="behandling">
                                    <div className="mb-4">
                                        {isLoading && (
                                            <Box background="info-soft" padding="space-4">
                                                <HStack gap="space-4" align="center">
                                                    <Loader size="medium" />
                                                    <BodyShort>Behandler...</BodyShort>
                                                </HStack>
                                            </Box>
                                        )}
                                        <Box
                                            padding="space-2"
                                            borderRadius="4"
                                            borderWidth="1"
                                            borderColor="warning"
                                            marginBlock="space-4"
                                        >
                                            <VStack gap="space-2">
                                                <HStack gap="space-2" wrap>
                                                    {adminActions.map((action) => (
                                                        <Button
                                                            key={action.key}
                                                            variant="secondary"
                                                            size="xsmall"
                                                            icon={<action.icon />}
                                                            onClick={() => handleAction(action)}
                                                            loading={action.mutation.isPending}
                                                            disabled={isLoading && !action.mutation.isPending}
                                                        >
                                                            {action.label}
                                                        </Button>
                                                    ))}
                                                </HStack>
                                            </VStack>
                                        </Box>
                                    </div>
                                </Tabs.Panel>
                            </Tabs>

                            {/* Response Data Display */}
                            {responseData && (
                                <Box
                                    background="success-soft"
                                    padding="space-4"
                                    borderRadius="4"
                                    borderWidth="1"
                                    borderColor="success"
                                >
                                    <VStack gap="space-4">
                                        <Heading size="small">
                                            <HStack gap="space-2" align="center">
                                                Response
                                            </HStack>
                                        </Heading>
                                        <JsonViewer data={responseData.data} maxDepth={10} />
                                        <HStack gap="space-2">
                                            <CopyButton
                                                size="small"
                                                copyText={JSON.stringify(responseData.data)}
                                                text="Kopier JSON"
                                            />
                                            <Button
                                                size="small"
                                                variant="secondary"
                                                onClick={() => {
                                                    const jsonString = JSON.stringify(responseData.data, null, 2);
                                                    const url = URL.createObjectURL(
                                                        new Blob([jsonString], { type: "application/json" }),
                                                    );
                                                    window.open(url);
                                                }}
                                            >
                                                Åpne i nytt vindu
                                            </Button>
                                        </HStack>
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
};

function Søknadsid() {
    const { søknadsid } = useGetBehandlingV2();
    if (!søknadsid) return null;
    return (
        <BodyShort size="small" className="flex items-end justify-end w-max h-0 flex-row gap-[5px]">
            <CopyButton
                size="small"
                text={søknadsid.toString()}
                copyText={søknadsid.toString()}
                title="Kopier søknadsid"
            />
        </BodyShort>
    );
}
