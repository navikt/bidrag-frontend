import { describe, expect, test } from "vitest";
import { loader } from "./SakRolleRedirect";

describe("SakRolleRedirect", () => {
    test("bevarer parametere og sender eksisterende sak til rollebildet", async () => {
        const response = await loader({
            request: new Request(
                "https://bidrag.nav.no/sak/rolle?saksnummer=1234567&enhet=4806&sessionState=test&from=bisys",
            ),
        });

        expect(response.headers.get("Location")).toBe(
            "https://bidrag.nav.no/sak/1234567/saksroller?enhet=4806&sessionState=test&from=bisys",
        );
    });

    test("bevarer parametere og sender ny sak til veiviseren", async () => {
        const response = await loader({
            request: new Request("https://bidrag.nav.no/sak/rolle?enhet=4806&sessionState=test&from=bisys"),
        });

        expect(response.headers.get("Location")).toBe(
            "https://bidrag.nav.no/sak/ny/saksroller?enhet=4806&sessionState=test&from=bisys",
        );
    });
});
