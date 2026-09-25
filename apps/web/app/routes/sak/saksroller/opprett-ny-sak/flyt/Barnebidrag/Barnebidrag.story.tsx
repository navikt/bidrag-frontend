import { barnkurver, testpersoner, ukjentBarnkurv } from "@ct/opprett-ny-sak/fixtures";
import { WizardFlowStory } from "@ct/opprett-ny-sak/WizardFlowStory";

export const ForelderMedBarn = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: barnkurver,
        }}
    />
);

export const ForelderUkjentBidragsmottaker = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: ukjentBarnkurv,
        }}
    />
);

export const ForelderUtenBarn = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: [],
        }}
    />
);

export const BarnUnder18 = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.barnUnder18,
            rolle: "barn_under_18",
            relasjoner: [],
        }}
    />
);

export const BarnOver18 = () => (
    <WizardFlowStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.barnOver18,
            rolle: "barn_over_18",
            relasjoner: [],
        }}
    />
);
