import { Suspense } from "react";
import {
    FormControlledCustomTextareaEditor,
    type FormControlledCustomTextEditorProps,
} from "../../../common/components/formFields/FormControlledCustomTextEditor";
import ForholdsmessigFordelingInfo from "../../forholdsmessigfordeling/ForholdsmessigFordelingInfo";

export const BegrunnelseSidemeny = (props: FormControlledCustomTextEditorProps) => {
    return (
        <>
            <Suspense fallback={null}>
                <ForholdsmessigFordelingInfo />
            </Suspense>
            <FormControlledCustomTextareaEditor {...props} />
        </>
    );
};
