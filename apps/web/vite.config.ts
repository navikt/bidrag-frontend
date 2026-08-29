import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";
import { readBuildEnv } from "./env.build";

export default defineConfig(({ command, mode }) => {
    const { CDN_BASE_URL } = readBuildEnv({ command, mode });

    return {
        plugins: [
            // MDX brukes av brukerveiledningene i @bidrag/behandling-app.
            // providerImportSource kreves for at MDXProvider i PageWrapper skal
            // levere komponenter (ikoner, Heading osv.) inn i .mdx-filene.
            {
                enforce: "pre",
                ...mdx({
                    providerImportSource: "@mdx-js/react",
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [rehypeSlug],
                }),
            },
            reactRouter(),
            tailwindcss(),
        ],
        resolve: {
            tsconfigPaths: true,
            dedupe: ["react", "react-dom"],
            alias: [
                // tsconfig peker @bidrag/behandling-app til en type-deklarasjon for å slippe
                // strict typesjekk av pakkens kildekode. Vite må fortsatt bruke kildekoden.
                {
                    find: /^@bidrag\/behandling$/,
                    replacement: fileURLToPath(new URL("../behandling/src/index.ts", import.meta.url)),
                },
            ],
        },
        server: {
            port: 3000,
            host: true, // Lytt på 0.0.0.0 slik at host.docker.internal kan nå serveren
        },
        // Peker klientbundlene mot CDN i prod, se .github/workflows/build-and-test.yml
        base: CDN_BASE_URL,
        build: {
            sourcemap: true,
            rollupOptions: {
                // Absolutt sti slik at nais.js alltid hentes fra samme origin som siden,
                // uavhengig av CDN_BASE_URL (nais.js genereres og monteres av Nais i poden)
                external: ["/nais.js"],
            },
        },
        optimizeDeps: {
            exclude: ["@bidrag/common", "@bidrag/api", "@bidrag/utils"],
            // @bidrag/redigering lastes via React.lazy (for å unngå at SSR evaluerer
            // pdfjs-dist/web/pdf_viewer, som krasjer uten `window`/`document`). Fordi
            // react-zoom-pan-pinch kun brukes inne i den lazy-lastede pakken, blir den
            // ikke oppdaget av Vites innledende avhengighetsskann, som kan gi en
            // midlertidig duplisert React-instans ("Invalid hook call") ved første
            // navigering til /rediger. Ved å inkludere den eksplisitt her (og som
            // ordinær dependency i package.json, slik at den også følger med i
            // produksjonsutrullingen via `pnpm deploy --prod`) blir den
            // forhåndsbundlet sammen med resten av appen fra start.
            include: ["react-zoom-pan-pinch"],
        },
    };
});
