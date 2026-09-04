// Story-discovery: glob-kallene er relative til DENNE filen (Vite krever statisk
// analyserbare import.meta.glob-kall), derfor kan de ikke flyttes til delt/pakket kode.
// Vi samler stories fra BÅDE apps/web og @bidrag/common i én felles liste, delt mellom
// test-kontrakten (main.tsx/index.html, brukt av Playwright) og manuell utforsking
// (browse.tsx/browse.html, kun for mennesker som vil bla gjennom stories i nettleseren).
export type StoryImporter = () => Promise<Record<string, unknown>>;

function normaliser(glob: Record<string, () => Promise<unknown>>, stripPrefix: RegExp, kilde: string) {
    const entries = Object.entries(glob);
    // Varsle i konsollen hvis mønsteret ikke lenger matcher noe (f.eks. etter en
    // mappe-omstrukturering) - import.meta.glob returnerer stille {} ved feil sti.
    if (entries.length === 0) {
        console.warn(
            `[story-galleri] Fant ingen *.story.tsx-filer for "${kilde}". Sjekk at glob-mønsteret fortsatt matcher mappestrukturen (se stories.ts).`,
        );
    }
    const map: Record<string, StoryImporter> = {};
    for (const [file, importer] of entries) {
        const path = file.replace(stripPrefix, "").replace(/\.story\.\w+$/, "");
        map[path] = importer as StoryImporter;
    }
    return map;
}

export const stories: Record<string, StoryImporter> = normaliser(
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

export async function resolve(storyId: string) {
    // Filnivå: storyId er selve filstien uten eksportnavn (browse-menyen lenker kun hit) -
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

// Kun for browse.tsx (manuell utforsking) - lister alle navngitte komponent-eksporter
// (stor forbokstav) per story-fil, slik at menyen kan lenke til hver variant/scenario
// i filer med flere eksporter (f.eks. ForelderRolleVisning.story.tsx sine 4 scenarioer),
// ikke bare filen som helhet. Bruker await bevisst - denne siden lastes aldri av
// Playwright-tester, kun av mennesker som åpner galleriet i nettleseren.
export async function eksporterPerFil(filsti: string) {
    const mod = await stories[filsti]();
    return Object.keys(mod).filter((navn) => /^[A-Z]/.test(navn));
}
