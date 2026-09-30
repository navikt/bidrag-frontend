import { barnkurver, testpersoner, ukjentBarnkurv } from "@ct/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "@ct/opprett-ny-sak/OpprettSak.story";

export const ForelderMedBarn = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: barnkurver,
        }}
    />
);

export const ForelderUkjentBidragsmottaker = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: ukjentBarnkurv,
        }}
    />
);

export const ForelderUtenBarn = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: [],
        }}
    />
);

export const BarnUnder18 = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.barnUnder18,
            rolle: "barn_under_18",
            relasjoner: [],
        }}
    />
);

export const BarnOver18 = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.barnOver18,
            rolle: "barn_over_18",
            relasjoner: [],
        }}
    />
);
