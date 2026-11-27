import { describe, expect, it } from "vitest";
import { opprettSekvensiellLagring } from "./sekvensiellLagring";

const opprettKontrollertLagring = () => {
    const kall: string[] = [];
    const ventende: (() => void)[] = [];
    const lagre = (name: string) =>
        new Promise<void>((resolve) => {
            kall.push(name);
            ventende.push(resolve);
        });
    const fullførNeste = async () => {
        ventende.shift()?.();
        await new Promise((resolve) => setTimeout(resolve, 0));
    };
    return { kall, lagre, fullførNeste };
};

describe("opprettSekvensiellLagring", () => {
    it("sender ikke en ny lagring før den pågående er ferdig", async () => {
        const { kall, lagre, fullførNeste } = opprettKontrollertLagring();
        const onSave = opprettSekvensiellLagring(lagre);

        onSave("rimeligÅInnvilge");
        onSave("begrunnelse");

        expect(kall).toEqual(["rimeligÅInnvilge"]);
        await fullførNeste();
        expect(kall).toEqual(["rimeligÅInnvilge", "begrunnelse"]);
    });

    it("gir bare én ny lagring for flere endringer mens en lagring pågår", async () => {
        const { kall, lagre, fullførNeste } = opprettKontrollertLagring();
        const onSave = opprettSekvensiellLagring(lagre);

        onSave("rimeligÅInnvilge");
        onSave("begrunnelse");
        onSave("rimeligÅInnvilge");
        onSave("begrunnelse");

        await fullførNeste();
        await fullførNeste();
        expect(kall).toEqual(["rimeligÅInnvilge", "begrunnelse"]);
    });

    it("lagrer på nytt med en gang når ingen lagring pågår", async () => {
        const { kall, lagre, fullførNeste } = opprettKontrollertLagring();
        const onSave = opprettSekvensiellLagring(lagre);

        onSave("rimeligÅInnvilge");
        await fullførNeste();
        onSave("begrunnelse");

        expect(kall).toEqual(["rimeligÅInnvilge", "begrunnelse"]);
    });

    it("fortsetter med neste lagring når en lagring feiler", async () => {
        const kall: string[] = [];
        const onSave = opprettSekvensiellLagring(async (name) => {
            kall.push(name);
            if (kall.length === 1) throw new Error("Feil");
        });

        await expect(onSave("rimeligÅInnvilge")).rejects.toThrow("Feil");
        await onSave("begrunnelse");

        expect(kall).toEqual(["rimeligÅInnvilge", "begrunnelse"]);
    });
});
