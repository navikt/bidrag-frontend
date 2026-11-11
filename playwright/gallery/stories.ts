export type StoryImporter = () => Promise<Record<string, unknown>>;

const storyFiles = import.meta.glob<Record<string, unknown>>([
    "../../apps/web/app/**/*.story.tsx",
    "../../apps/*/src/**/*.story.tsx",
    "../../packages/*/src/**/*.story.tsx",
]);

export const stories: Record<string, StoryImporter> = {};
const storyPaths = new Map<string, string>();
for (const [file, importer] of Object.entries(storyFiles)) {
    const path = file
        .replace(/^(\.\.\/)+(?:apps\/web\/app\/|(?:apps|packages)\/[^/]+\/src\/)/, "")
        .replace(/\.story\.tsx$/, "");
    const previousFile = storyPaths.get(path);
    if (previousFile) {
        throw new Error(`Duplikat story-sti "${path}" i "${previousFile}" og "${file}".`);
    }
    storyPaths.set(path, file);
    stories[path] = importer;
}

if (storyPaths.size === 0) {
    throw new Error("[story-galleri] Fant ingen *.story.tsx-filer. Sjekk glob-mønstrene i stories.ts.");
}

export async function resolve(storyId: string) {
    const sep = storyId.lastIndexOf("/");
    if (sep <= 0 || sep === storyId.length - 1) {
        throw new Error(`Ugyldig story-ID "${storyId}". Bruk "filsti/Eksportnavn".`);
    }
    const [path, name] = [storyId.slice(0, sep), storyId.slice(sep + 1)];
    const importer = stories[path];
    if (!importer) {
        throw new Error(
            `Ukjent story-sti "${path}". Tilgjengelige stier: ${Object.keys(stories).join(", ") || "(ingen)"}`,
        );
    }
    const mod = await importer();
    if (!Object.hasOwn(mod, name) || mod[name] === undefined) {
        throw new Error(
            `Ukjent story-eksport "${name}" i "${path}". Tilgjengelige eksporter: ${Object.keys(mod).join(", ")}.`,
        );
    }
    return mod[name];
}

export async function eksporterPerFil(filsti: string) {
    const importer = stories[filsti];
    if (!importer) {
        throw new Error(`Ukjent story-sti "${filsti}".`);
    }
    const mod = await importer();
    return Object.keys(mod).filter((navn) => /^[A-Z]/.test(navn));
}
