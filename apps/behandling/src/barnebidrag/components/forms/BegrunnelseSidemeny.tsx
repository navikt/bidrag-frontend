import React from "react";

import {
    FormControlledCustomTextareaEditor,
    type FormControlledCustomTextEditorProps,
} from "../../../common/components/formFields/FormControlledCustomTextEditor";
import ForholdsmessigFordelingInfo from "../../forholdsmessigfordeling/ForholdsmessigFordelingInfo";

export const BegrunnelseSidemeny = (props: FormControlledCustomTextEditorProps) => {
    return (
        <>
            <React.Suspense fallback={null}>
                <ForholdsmessigFordelingInfo />
            </React.Suspense>
            <FormControlledCustomTextareaEditor {...props} />
        </>
    );
};
