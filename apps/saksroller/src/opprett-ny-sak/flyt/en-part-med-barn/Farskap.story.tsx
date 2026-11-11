import { barnkurver, testpersoner } from "../../../../playwright/opprett-ny-sak/fixtures";
import { OpprettSakSkjemaStory } from "../../../../playwright/opprett-ny-sak/OpprettSak.story";

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
