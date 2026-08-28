import "@navikt/ds-css";
import "../../app/index.css";

import { BodyLong, BodyShort, Box, Detail, Heading, Link, VStack } from "@navikt/ds-react";
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

// Story-discovery: glob-kallene er relative til DENNE filen (Vite krever statisk
// analyserbare import.meta.glob-kall), derfor kan de ikke flyttes til delt/pakket kode.
// Vi samler stories fra BÅDE apps/web og @bidrag/common i ett felles galleri,
// slik at man kan navigere mellom stories i begge pakker fra samme venstremeny.
type StoryImporter = () => Promise<Record<string, unknown>>;

function normaliser(glob: Record<string, () => Promise<unknown>>, stripPrefix: RegExp, kilde: string) {
    const entries = Object.entries(glob);
    // Varsle i konsollen hvis mønsteret ikke lenger matcher noe (f.eks. etter en
    // mappe-omstrukturering) - import.meta.glob returnerer stille {} ved feil sti.
    if (entries.length === 0) {
        console.warn(
            `[story-galleri] Fant ingen *.story.tsx-filer for "${kilde}". Sjekk at glob-mønsteret fortsatt matcher mappestrukturen (se main.tsx).`,
        );
    }
    const map: Record<string, StoryImporter> = {};
    for (const [file, importer] of entries) {
        const path = file.replace(stripPrefix, "").replace(/\.story\.\w+$/, "");
        map[path] = importer as StoryImporter;
    }
    return map;
}

const stories: Record<string, StoryImporter> = normaliser(
    import.meta.glob("../../app/**/*.story.tsx"),
    /^(\.\.\/)+app\//,
    "apps/web/app",
);
const commonStories = normaliser(
    import.meta.glob("../../../../packages/common/src/**/*.story.tsx"),
    /^(\.\.\/)+packages\/common\/src\//,
    "packages/common/src",
);
for (const [path, importer] of Object.entries(commonStories)) {
    if (stories[path]) {
        throw new Error(`Duplikat story-sti "${path}" mellom apps/web og packages/common.`);
    }
    stories[path] = importer;
}

async function resolve(storyId: string) {
    // Filnivå: storyId er selve filstien uten eksportnavn (menyen lenker kun hit) -
    // velg default-eksport, ellers første komponent-eksport (stor forbokstav).
    if (stories[storyId]) {
        const mod = await stories[storyId]();
        const navn = Object.keys(mod).find((n) => /^[A-Z]/.test(n));
        return mod?.default ?? (navn ? mod[navn] : undefined);
    }
    const sep = storyId.lastIndexOf("/");
    const [path, name] = [storyId.slice(0, sep), storyId.slice(sep + 1)];
    const importer = stories[path];
    if (!importer) {
        throw new Error(
            `Ukjent story-sti "${path}". Tilgjengelige stier: ${Object.keys(stories).join(", ") || "(ingen)"}`,
        );
    }
    const mod = await importer();
    return mod?.[name] ?? mod?.default;
}

// Menyen lenker kun til filnivå (se resolve()) - ingen behov for å importere/awaite
// hver story-modul bare for å bygge navigasjonen. Filstiene er kjent synkront fra
// import.meta.glob-nøklene. Ønsker du en spesifikk variant/eksport i en fil med flere
// stories, kan du legge til /EksportNavn manuelt i URL-en (se hint i Velkomst).
function grupperPerSeksjon(filstier: string[]) {
    const seksjoner = new Map<string, string[]>();
    for (const filsti of filstier) {
        const sep = filsti.lastIndexOf("/");
        const seksjon = sep === -1 ? "/" : filsti.slice(0, sep);
        const fil = sep === -1 ? filsti : filsti.slice(sep + 1);
        seksjoner.set(seksjon, [...(seksjoner.get(seksjon) ?? []), fil]);
    }
    return [...seksjoner.entries()];
}

function Sidebar({ filstier, valgtStoryId }: { filstier: string[]; valgtStoryId?: string }) {
    const seksjoner = grupperPerSeksjon(filstier);

    return (
        <Box
            as="nav"
            background="sunken"
            borderColor="neutral-subtle"
            borderWidth="0 1 0 0"
            padding="space-24"
            style={{ height: "100vh", overflowY: "auto", position: "sticky", top: 0 }}
        >
            <VStack gap="space-28">
                <Heading level="1" size="small">
                    🖼️ Stories
                </Heading>
                {seksjoner.map(([seksjon, filer]) => {
                    // Viser kun siste mappenavn i menyen (f.eks. "saksroller", "header")
                    // for et lesbart hierarki - selve story-ID-en (brukt i href/mount)
                    // beholder likevel hele stien, så den forblir unik på tvers av pakker.
                    const seksjonsnavn = seksjon.split("/").pop() || seksjon;
                    return (
                        <VStack key={seksjon} gap="space-16">
                            <Detail textColor="subtle" uppercase title={seksjon}>
                                {seksjonsnavn}
                            </Detail>
                            <VStack gap="space-8">
                                {filer.map((fil) => {
                                    const storyId = `${seksjon}/${fil}`;
                                    const aktiv = valgtStoryId === storyId || valgtStoryId?.startsWith(`${storyId}/`);
                                    return (
                                        <Link
                                            key={fil}
                                            href={`?story=${encodeURIComponent(storyId)}`}
                                            underline={false}
                                            style={aktiv ? { fontWeight: 600 } : undefined}
                                        >
                                            {aktiv ? "▸ " : ""}
                                            {fil}
                                        </Link>
                                    );
                                })}
                            </VStack>
                        </VStack>
                    );
                })}
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

function getRequiredElement(id: string) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Story-galleriet mangler nødvendig element: #${id}`);
    return element;
}

const rootEl = getRequiredElement("root");
const sidebarEl = getRequiredElement("sidebar");
let root: Root | undefined;
let harMontertViaApi = false;

declare global {
    interface Window {
        mount: (params: { story: string; props?: Record<string, unknown> }) => Promise<void>;
        unmount: () => Promise<void>;
    }
}

window.mount = async ({ story, props }) => {
    harMontertViaApi = true;
    const Story = (await resolve(story)) as React.ComponentType<Record<string, unknown>> | undefined;
    if (!Story) throw new Error(`Unknown story: ${story}`);
    if (!root) root = createRoot(rootEl);
    const currentRoot = root; // gjenbruk root slik at update() rekonsilierer og bevarer state
    // flushSync slik at en render-feil avviser Promise-en i stedet for å bli svelget.
    flushSync(() => {
        currentRoot.render(
            <StrictMode>
                <Story {...props} />
            </StrictMode>,
        );
    });
};

window.unmount = async () => {
    root?.unmount();
    root = undefined;
};

const storyIdFraUrl = new URLSearchParams(location.search).get("story");
if (storyIdFraUrl) {
    window.mount({ story: storyIdFraUrl });
}

// Playwright sin mount()-fixture navigerer til denne siden UTEN ?story= og kaller så
// window.mount() manuelt via page.evaluate() - harMontertViaApi-sjekken hindrer at siden under
// rendres etter (og dermed overskriver) en story som allerede ble mountet av en automatisert test.
// Filstiene er kjent synkront (glob-nøklene) - ingen await nødvendig for å bygge menyen.
const filstier = Object.keys(stories).sort();
if (storyIdFraUrl || !harMontertViaApi) {
    createRoot(sidebarEl).render(
        <StrictMode>
            <Sidebar filstier={filstier} valgtStoryId={storyIdFraUrl ?? undefined} />
        </StrictMode>,
    );
}
if (!storyIdFraUrl && !harMontertViaApi) {
    root ??= createRoot(rootEl);
    root.render(
        <StrictMode>
            <Velkomst antallFiler={filstier.length} />
        </StrictMode>,
    );
}
