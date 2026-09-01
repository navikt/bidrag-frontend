import { ErrorSummary as ErrorSummaryDS, Link } from "@navikt/ds-react";
import type React from "react";
import { useRef } from "react";
import type { DeepMap } from "react-hook-form";
export interface FeiloppsummeringFeil {
    /**
     * ID til skjemaelementet som feilmeldingen tilhører.
     */
    skjemaelementId: string;
    /**
     * Selve feilmeldingen.
     */
    feilmelding: string;
}
interface ErrorSummaryProps {
    errors: DeepMap<any, any>;
}

export default function ErrorSummary(props: ErrorSummaryProps) {
    const { errors } = props;
    const ref = useRef<HTMLDivElement>(null);

    const hasErrors = () => Object.keys(props.errors).length > 0;

    function focusElement(elementId: string) {
        let element = document.getElementById(elementId);
        if (element && !(element instanceof HTMLInputElement)) {
            element = element.querySelector(`input[aria-invalid="true"]`)
                ? element.querySelector(`input[aria-invalid="true"]`)
                : element.querySelector("input");
        }
        element?.focus();
    }

    function customFeilRender(feil: FeiloppsummeringFeil): React.ReactNode {
        return (
            <Link
                as="span"
                onClick={(e) => {
                    e.preventDefault();
                    focusElement(feil.skjemaelementId);
                }}
            >
                {feil.feilmelding}
            </Link>
        );
    }

    function getErrorProps(errors: any): FeiloppsummeringFeil[] {
        if (Array.isArray(errors)) {
            return errors
                .flatMap((error) => {
                    if (error.ref) {
                        return error;
                    }
                    return Object.keys(error).map((key) => error[key]);
                })
                .map((error) => ({
                    skjemaelementId: error?.ref.id,
                    feilmelding: error?.message,
                }));
        }
        return [
            {
                skjemaelementId: errors?.ref.id,
                feilmelding: errors.message,
            },
        ];
    }

    if (!hasErrors()) {
        return null;
    }

    return (
        <div data-testid={"errorsummary"} ref={ref} style={{ width: "inherit" }}>
            <ErrorSummaryDS title="For å gå videre må du rette opp følgende:">
                {Object.keys(errors)
                    .sort()
                    .flatMap((key) => getErrorProps(errors[key]))
                    .map((error) => (
                        <ErrorSummaryDS.Item key={error.skjemaelementId}>{customFeilRender(error)}</ErrorSummaryDS.Item>
                    ))}
            </ErrorSummaryDS>
        </div>
    );
}
