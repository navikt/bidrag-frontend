// pdfjs-dist ships its "web/pdf_viewer" submodule types only as a
// `.d.mts` file, which TypeScript's "bundler" module resolution doesn't
// always pick up for a plain `pdfjs-dist/web/pdf_viewer` specifier. Point it
// at the underlying `.d.ts` file that ships the same declarations.
declare module "pdfjs-dist/web/pdf_viewer" {
    export * from "pdfjs-dist/types/web/pdf_viewer.component";
}
