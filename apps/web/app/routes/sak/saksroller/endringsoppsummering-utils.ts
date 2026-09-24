import type { BarnRolle, SakRedigeringData } from "./sakvisning-schema.ts";

export type Endringsrad =
    | {
          id: string;
          type: "lagtTil";
          rolleType: string;
          ident: string;
          harUfullstendigRelasjon: boolean;
      }
    | {
          id: string;
          type: "fjernet";
          rolleType: string;
          ident: string;
          harUfullstendigRelasjon: boolean;
      }
    | {
          id: string;
          type: "endretReellMottaker";
          rolleType: string;
          ident: string;
          fraReellMottaker: string;
          tilReellMottaker: string;
          fraReellMottakerNavn?: string;
          tilReellMottakerNavn?: string;
          harUfullstendigRelasjon: boolean;
      };

type NormalisertRolle = {
    key: string;
    rolleType: string;
    fodselsnummer: string;
    reellMottaker: string;
    reellMottakerNavn?: string;
};

function lagRolleSignatur(rolle: SakRedigeringData["roller"][number]): string {
    const rolleType = rolle.rolleType || rolle.type;
    const fodselsnummer = rolle.fodselsnummer || "";
    return `${rolleType}-${fodselsnummer || rolle.objektnummer || "mangler-ident"}`;
}

function normaliserRoller(roller: SakRedigeringData["roller"]): NormalisertRolle[] {
    const forekomstMap = new Map<string, number>();

    return roller.map((rolle) => {
        const signatur = lagRolleSignatur(rolle);
        const forekomst = (forekomstMap.get(signatur) || 0) + 1;
        forekomstMap.set(signatur, forekomst);

        const rolleType = rolle.rolleType || rolle.type;
        const fodselsnummer = rolle.fodselsnummer || "";
        return {
            key: `${signatur}-${forekomst}`,
            rolleType,
            fodselsnummer,
            reellMottaker: (rolle as BarnRolle).reellMottaker || "",
            reellMottakerNavn: (rolle as BarnRolle).reellMottakerNavn,
        };
    });
}

export function lagEndringsoppsummering(
    opprinneligeRoller: SakRedigeringData["roller"],
    nåværendeRoller: SakRedigeringData["roller"],
    barnMedUfullstendigRelasjon: string[] = [],
): Endringsrad[] {
    const opprinnelige = normaliserRoller(opprinneligeRoller);
    const nåværende = normaliserRoller(nåværendeRoller);

    const opprinneligeMap = new Map(opprinnelige.map((rolle) => [rolle.key, rolle]));
    const nåværendeMap = new Map(nåværende.map((rolle) => [rolle.key, rolle]));
    const harUfullstendigRelasjon = (ident: string) => barnMedUfullstendigRelasjon.includes(ident);

    const lagtTil = nåværende
        .filter((rolle) => !opprinneligeMap.has(rolle.key))
        .map(
            (rolle): Endringsrad => ({
                id: `lagt-til-${rolle.key}`,
                type: "lagtTil",
                rolleType: rolle.rolleType,
                ident: rolle.fodselsnummer,
                harUfullstendigRelasjon: harUfullstendigRelasjon(rolle.fodselsnummer),
            }),
        );

    const fjernet = opprinnelige
        .filter((rolle) => !nåværendeMap.has(rolle.key))
        .map(
            (rolle): Endringsrad => ({
                id: `fjernet-${rolle.key}`,
                type: "fjernet",
                rolleType: rolle.rolleType,
                ident: rolle.fodselsnummer,
                harUfullstendigRelasjon: harUfullstendigRelasjon(rolle.fodselsnummer),
            }),
        );

    const endretReellMottaker = nåværende
        .filter((rolle) => opprinneligeMap.has(rolle.key) && rolle.rolleType === "BA")
        .flatMap((rolle) => {
            const opprinneligRolle = opprinneligeMap.get(rolle.key);
            if (!opprinneligRolle || opprinneligRolle.reellMottaker === rolle.reellMottaker) return [];

            return [
                {
                    id: `reell-mottaker-${rolle.key}`,
                    type: "endretReellMottaker",
                    rolleType: rolle.rolleType,
                    ident: rolle.fodselsnummer,
                    fraReellMottaker: opprinneligRolle.reellMottaker.trim() || "ingen",
                    tilReellMottaker: rolle.reellMottaker.trim() || "ingen",
                    fraReellMottakerNavn: opprinneligRolle.reellMottakerNavn,
                    tilReellMottakerNavn: rolle.reellMottakerNavn,
                    harUfullstendigRelasjon: harUfullstendigRelasjon(rolle.fodselsnummer),
                } satisfies Endringsrad,
            ];
        });

    return [...lagtTil, ...fjernet, ...endretReellMottaker];
}
