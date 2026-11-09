import {
    barnkurver,
    kjentOgUkjentBarnkurv,
    testpersoner,
    ukjentBarnkurv,
} from "../../../../playwright/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "../../../../playwright/opprett-ny-sak/OpprettSak.story";
import { ANNEN_FORELDER_FLAGG } from "../../../felles/relasjon/useRelasjonsregler";

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

export const ForelderUkjentBidragsmottakerAnnenForelderTillatt = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: ukjentBarnkurv,
        }}
        flagg={[ANNEN_FORELDER_FLAGG]}
    />
);

export const ForelderMedKjentOgUkjentMotpart = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "BARNEBIDRAG",
            person: testpersoner.bidragspliktig,
            rolle: "bidragspliktig",
            relasjoner: kjentOgUkjentBarnkurv,
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
