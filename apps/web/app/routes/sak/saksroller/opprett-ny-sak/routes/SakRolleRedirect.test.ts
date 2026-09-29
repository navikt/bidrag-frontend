import { expect, test } from "vitest";
import { loader as nySakLegacyLoader } from "./NySakLegacyRedirect";
import { loader as sakRolleLoader } from "./SakRolleRedirect";

const parametere = "enhet=4806&sessionState=test&from=bisys";

test.each([
    {
        loader: sakRolleLoader,
        fra: `/sak/rolle?saksnummer=1234567&${parametere}`,
        til: `/sak/1234567/saksroller?${parametere}`,
    },
    { loader: sakRolleLoader, fra: `/sak/rolle?${parametere}`, til: `/sak/ny?${parametere}` },
    { loader: nySakLegacyLoader, fra: `/sak/ny/saksroller?${parametere}`, til: `/sak/ny?${parametere}` },
])("$fra sendes til $til", async ({ loader, fra, til }) => {
    const response = await loader({ request: new Request(`https://bidrag.nav.no${fra}`) });

    expect(response.headers.get("Location")).toBe(`https://bidrag.nav.no${til}`);
});
