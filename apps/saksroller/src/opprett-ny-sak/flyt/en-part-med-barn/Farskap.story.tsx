import { barnkurver, testpersoner } from "@ct-saksroller/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "@ct-saksroller/opprett-ny-sak/OpprettSak.story";

export const Standard = () => (
    <OpprettSakSkjemaStory
        scenario={{
            sakstype: "FARSKAP",
            person: testpersoner.bidragsmottaker,
            rolle: "bidragsmottaker",
            relasjoner: barnkurver,
        }}
    />
);
