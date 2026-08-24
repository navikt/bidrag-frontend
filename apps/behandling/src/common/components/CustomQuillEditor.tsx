import { Loader } from "@navikt/ds-react";
import { lazy, Suspense } from "react";

import type { EditorProps } from "./CustomQuillEditorImpl";

/**
 * Quill (og quill-paste-smart) krever `window`/`self` allerede ved import, så editoren
 * kan ikke lastes under server-side rendering. Vi laster den derfor kun i nettleseren.
 */
const CustomQuillEditorImpl = lazy(() =>
    import("./CustomQuillEditorImpl").then((modul) => ({ default: modul.CustomQuillEditor })),
);

export const CustomQuillEditor = (props: EditorProps) => {
    if (typeof window === "undefined") {
        return <Loader size="small" />;
    }

    return (
        <Suspense fallback={<Loader size="small" />}>
            <CustomQuillEditorImpl {...props} />
        </Suspense>
    );
};
