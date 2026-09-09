import "@navikt/ds-css";
import "../../app/index.css";

import { BodyLong, BodyShort, Box, Detail, Heading, Link, VStack } from "@navikt/ds-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { worker } from "./mocks/browser";
import { eksporterPerFil, resolve, stories } from "./stories";

// Mocker proxy-API-kall stories kan trigge på mount, siden det ikke finnes noen
// ekte backend bak galleriets Vite-server. Må startes før stories mountes.
const mockKlar = worker.start({ onUnhandledRequest: "bypass" });

type StoryTre = {
    filer: string[];
    mapper: Map<string, StoryTre>;
};

function byggStoryTre(filstier: string[]) {
    const rot: StoryTre = { filer: [], mapper: new Map() };

    for (const filsti of filstier) {
        const deler = filsti.split("/");
        const fil = deler.pop();
        if (!fil) continue;

        let node = rot;
        for (const mappe of deler) {
            let barn = node.mapper.get(mappe);
            if (!barn) {
                barn = { filer: [], mapper: new Map() };
                node.mapper.set(mappe, barn);
            }
            node = barn;
        }
        node.filer.push(fil);
    }

    return rot;
}

function FilMedEksporter({
    filsti,
    eksportnavn,
    valgtStoryId,
}: {
    filsti: string;
    eksportnavn: string[];
    valgtStoryId?: string;
}) {
    const fil = filsti.split("/").pop() ?? filsti;

    if (eksportnavn.length <= 1) {
        const aktiv = valgtStoryId === filsti || valgtStoryId?.startsWith(`${filsti}/`);
        return (
            <Link
                href={`?story=${encodeURIComponent(filsti)}`}
                underline={false}
                style={aktiv ? { fontWeight: 600 } : undefined}
            >
                {aktiv ? "▸ " : ""}
                {fil}
            </Link>
        );
    }

    return (
        <VStack gap="space-4">
            <BodyShort weight="semibold">{fil}</BodyShort>
            <VStack gap="space-4" paddingInline="space-12 space-0">
                {eksportnavn.map((navn) => {
                    const storyId = `${filsti}/${navn}`;
                    const aktiv = storyId === valgtStoryId;
                    return (
                        <Link
                            key={navn}
                            href={`?story=${encodeURIComponent(storyId)}`}
                            underline={false}
                            style={aktiv ? { fontWeight: 600 } : undefined}
                        >
                            {aktiv ? "▸ " : ""}
                            {navn}
                        </Link>
                    );
                })}
            </VStack>
        </VStack>
    );
}

function StoryTreMeny({
    tre,
    foreldresti = "",
    eksporterPerFil,
    valgtStoryId,
}: {
    tre: StoryTre;
    foreldresti?: string;
    eksporterPerFil: Record<string, string[]>;
    valgtStoryId?: string;
}) {
    return (
        <VStack gap="space-12">
            {[...tre.mapper.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mappe, barn]) => {
                    const mappeSti = [foreldresti, mappe].filter(Boolean).join("/");
                    return (
                        <VStack key={mappeSti} gap="space-8">
                            <Detail textColor="subtle" uppercase title={mappeSti}>
                                {mappe}
                            </Detail>
                            <Box paddingInline="space-12 space-0">
                                <StoryTreMeny
                                    tre={barn}
                                    foreldresti={mappeSti}
                                    eksporterPerFil={eksporterPerFil}
                                    valgtStoryId={valgtStoryId}
                                />
                            </Box>
                        </VStack>
                    );
                })}
            {tre.filer.sort().map((fil) => {
                const filsti = [foreldresti, fil].filter(Boolean).join("/");
                return (
                    <FilMedEksporter
                        key={filsti}
                        filsti={filsti}
                        eksportnavn={eksporterPerFil[filsti] ?? []}
                        valgtStoryId={valgtStoryId}
                    />
                );
            })}
        </VStack>
    );
}

function Sidebar({
    filstier,
    eksporterPerFil,
    valgtStoryId,
}: {
    filstier: string[];
    eksporterPerFil: Record<string, string[]>;
    valgtStoryId?: string;
}) {
    return (
        <Box
            as="nav"
            background="sunken"
            borderColor="neutral-subtle"
            borderWidth="0 1 0 0"
            padding="space-24"
            aria-label="Story-meny"
            style={{ height: "100vh", overflowY: "auto", position: "sticky", top: 0 }}
        >
            <VStack gap="space-28">
                <Heading level="1" size="small">
                    Stories
                </Heading>
                <StoryTreMeny
                    tre={byggStoryTre(filstier)}
                    eksporterPerFil={eksporterPerFil}
                    valgtStoryId={valgtStoryId}
                />
            </VStack>
        </Box>
    );
}

function Velkomst({ antallFiler }: { antallFiler: number }) {
    return (
        <VStack gap="5" maxWidth="40rem">
            <Heading level="1" size="xlarge">
                Story-galleri
            </Heading>
            <BodyLong size="large">Velg en story fra menyen til venstre for å mounte den.</BodyLong>
            <BodyShort textColor="subtle">
                {antallFiler} {antallFiler === 1 ? "story-fil" : "story-filer"} tilgjengelig. Menyen mounter
                default-eksporten i filen - vil du se en annen variant/eksport, legg til{" "}
                <Box as="code" background="accent-soft" padding="1" borderRadius="small">
                    /EksportNavn
                </Box>{" "}
                bak i URL-en selv, f.eks.{" "}
                <Box as="code" background="accent-soft" padding="1" borderRadius="small">
                    ?story=mappe/Fil/EksportNavn
                </Box>
                .
            </BodyShort>
        </VStack>
    );
}

function Feil({ storyId, melding }: { storyId: string; melding: string }) {
    return (
        <VStack gap="2" maxWidth="40rem">
            <Heading level="1" size="medium">
                Kunne ikke mounte story
            </Heading>
            <BodyShort>
                <Box as="code">{storyId}</Box>
            </BodyShort>
            <BodyShort textColor="subtle">{melding}</BodyShort>
        </VStack>
    );
}

function getRequiredElement(id: string) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Story-galleriet mangler nødvendig element: #${id}`);
    return element;
}

const rootEl = getRequiredElement("root");
const sidebarEl = getRequiredElement("sidebar");

const filstier = Object.keys(stories).sort();
const storyIdFraUrl = new URLSearchParams(location.search).get("story");

Promise.all(filstier.map((filsti) => eksporterPerFil(filsti).then((navn) => [filsti, navn] as const))).then((par) => {
    const eksporterPerFilMap = Object.fromEntries(par);
    createRoot(sidebarEl).render(
        <StrictMode>
            <Sidebar
                filstier={filstier}
                eksporterPerFil={eksporterPerFilMap}
                valgtStoryId={storyIdFraUrl ?? undefined}
            />
        </StrictMode>,
    );
});

const rootTreVisning = createRoot(rootEl);
if (storyIdFraUrl) {
    mockKlar
        .then(() => resolve(storyIdFraUrl))
        .then((Story) => {
            const KomponentType = Story as React.ComponentType<Record<string, unknown>> | undefined;
            if (!KomponentType) {
                rootTreVisning.render(
                    <StrictMode>
                        <Feil storyId={storyIdFraUrl} melding="Fant ingen komponent-eksport for denne stien." />
                    </StrictMode>,
                );
                return;
            }
            rootTreVisning.render(
                <StrictMode>
                    <KomponentType />
                </StrictMode>,
            );
        })
        .catch((error: unknown) => {
            rootTreVisning.render(
                <StrictMode>
                    <Feil storyId={storyIdFraUrl} melding={error instanceof Error ? error.message : String(error)} />
                </StrictMode>,
            );
        });
} else {
    rootTreVisning.render(
        <StrictMode>
            <Velkomst antallFiler={filstier.length} />
        </StrictMode>,
    );
}
