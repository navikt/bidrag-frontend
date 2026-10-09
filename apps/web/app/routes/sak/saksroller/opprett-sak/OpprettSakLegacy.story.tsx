import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import type { PersonDto } from "@bidrag/api/PersonApi";
import { BidragCommonsProviderMock } from "@bidrag/common/playwright/testing/BidragCommonsProviderMock.tsx";
import { Button } from "@navikt/ds-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlagProvider } from "@unleash/proxy-client-react";
import { useMemo, useState } from "react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { UnleashClient } from "unleash-proxy-client";
import BehandlingModal from "../../../../../../behandling/src/common/sak/OpprettSakModal";
import DokumentModal from "../../../../../../dokument/src/common/components/modal/opprett-sak-modal/OpprettSakModal";
import OpprettSakPage from "./OpprettSakPage";

type Person = Pick<PersonDto, "ident" | "visningsnavn" | "fødselsdato">;
type StoryProps = { person: Person; motpart: Person; barn: Person; søsken?: Person[]; nyFlyt?: boolean };
type Inngang = "behandling" | "dokument" | "web";

function ResultatOgModal({ inngang, person }: StoryProps & { inngang: Inngang }) {
    const [open, settOpen] = useState(false);
    const [saksnummer, settSaksnummer] = useState("");
    const [lukket, settLukket] = useState(false);
    const location = useLocation();
    const props = { ident: person.ident, navn: person.visningsnavn, eierfogd: "4806", onSubmit: settSaksnummer };

    return (
        <>
            <form hidden>
                <input data-testid="opprettet-saksnummer" readOnly value={saksnummer} />
                <input data-testid="lukket" readOnly value={String(lukket)} />
                <input data-testid="rute" readOnly value={location.pathname} />
            </form>
            {inngang === "behandling" && <BehandlingModal {...props} bpIdent="" rolle={Rolletype.BM} />}
            {inngang === "dokument" && (
                <>
                    <Button onClick={() => settOpen(true)}>Åpne opprett sak</Button>
                    <DokumentModal
                        {...props}
                        isOpen={open}
                        onClose={() => {
                            settOpen(false);
                            settLukket(true);
                        }}
                    />
                </>
            )}
            {inngang === "web" && location.pathname === "/sak/opprett" && <OpprettSakPage />}
        </>
    );
}

function LegacyStory(props: StoryProps & { inngang: Inngang }) {
    const queryClient = useMemo(() => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
        client.setQueryData(["hent_enhet_info", "4806"], { nummer: "4806", navn: "Nav Test" });
        return client;
    }, []);
    const unleashClient = useMemo(
        () =>
            new UnleashClient({
                url: "http://localhost:3178/unleash/proxy",
                clientKey: "playwright",
                appName: "legacy-modal-ct",
                disableMetrics: true,
                bootstrap: [
                    {
                        name: "bisys.ny_rollebilde",
                        impressionData: false,
                        enabled: props.nyFlyt ?? false,
                        variant: { name: "disabled", enabled: false },
                    },
                ],
            }),
        [props.nyFlyt],
    );
    const router = useMemo(() => {
        const params = new URLSearchParams({
            ident: props.person.ident,
            navn: props.person.visningsnavn,
            eierfogd: "4806",
            rolle: "BM",
        });
        return createMemoryRouter([{ path: "*", element: <ResultatOgModal {...props} /> }], {
            initialEntries: ["/start", `/sak/opprett?${params}`],
            initialIndex: 1,
        });
    }, [props]);

    return (
        <QueryClientProvider client={queryClient}>
            <FlagProvider unleashClient={unleashClient} startClient={false}>
                <BidragCommonsProviderMock
                    client={queryClient}
                    personer={Object.fromEntries(
                        [props.person, props.motpart, props.barn, ...(props.søsken ?? [])].map((p) => [p.ident, p]),
                    )}
                >
                    <RouterProvider router={router} />
                </BidragCommonsProviderMock>
            </FlagProvider>
        </QueryClientProvider>
    );
}

export const Behandling = (props: StoryProps) => <LegacyStory {...props} inngang="behandling" />;
export const Dokument = (props: StoryProps) => <LegacyStory {...props} inngang="dokument" />;
export const Web = (props: StoryProps) => <LegacyStory {...props} inngang="web" />;
