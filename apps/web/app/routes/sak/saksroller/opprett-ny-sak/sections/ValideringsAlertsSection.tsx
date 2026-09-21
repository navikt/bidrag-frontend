import BMUtenBarnAlert from "../components/BMUtenBarnAlert";
import KanIkkeOppretteSakAlert from "../components/KanIkkeOppretteSakAlert";
import UfullstendigRelasjonAlert from "../UfullstendigRelasjonAlert";

interface ValideringsAlertsSectionProps {
    visBMUtenBarnAlert?: boolean;
    visKanIkkeOppretteSakAlert?: boolean;
    visUfullstendigRelasjonAlert?: boolean;
}

/**
 * Samlet seksjon for valideringsadvarsler som vises i opprett-sak flow.
 * Gjør det lettere å håndtere flere advarsler konsistent.
 */
export default function ValideringsAlertsSection({
    visBMUtenBarnAlert = false,
    visKanIkkeOppretteSakAlert = false,
    visUfullstendigRelasjonAlert = false,
}: ValideringsAlertsSectionProps) {
    return (
        <>
            {visUfullstendigRelasjonAlert && <UfullstendigRelasjonAlert visAlert={true} />}

            {visBMUtenBarnAlert && <BMUtenBarnAlert visAlert={true} />}

            {visKanIkkeOppretteSakAlert && <KanIkkeOppretteSakAlert visAlert={true} />}
        </>
    );
}
