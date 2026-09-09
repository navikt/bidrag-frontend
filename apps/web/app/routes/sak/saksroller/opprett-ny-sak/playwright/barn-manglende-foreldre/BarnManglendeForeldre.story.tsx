import { testpersoner } from "../fixtures";
import { WizardFlowStory } from "../WizardFlowStory";

export const IngenKjenteForeldre = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARN_MANGLENDE_FORELDRE",
            partISaken: {
                ident: testpersoner.barnOver18.ident,
                navn: testpersoner.barnOver18.visningsnavn,
                rolle: "barn_over_18",
                erKjent: true,
            },
            forelder: null,
        }}
    />
);

export const EnKjentForelder = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            flow: "BARN_MANGLENDE_FORELDRE",
            partISaken: {
                ident: testpersoner.barnUnder18.ident,
                navn: testpersoner.barnUnder18.visningsnavn,
                rolle: "barn_under_18",
                erKjent: true,
            },
            forelder: testpersoner.bidragspliktig,
        }}
    />
);
