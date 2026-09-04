export type StoryImporter = () => Promise<Record<string, unknown>>;

function normaliser(glob: Record<string, () => Promise<unknown>>, stripPrefix: RegExp, kilde: string) {
    const entries = Object.entries(glob);
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

export async function eksporterPerFil(filsti: string) {
    const mod = await stories[filsti]();
    return Object.keys(mod).filter((navn) => /^[A-Z]/.test(navn));
}
