/**
 * Stories for `ExpandedRoles` - rollekort-panelet som vises under
 * saksnummer-fanene i `SakHeader`. Samme story + gallery-mønster som
 * `RolleCard.story.tsx`: en mocket `BidragCommonsProvider` rundt komponenten,
 */
import type { RolleDto } from "@bidrag/api/BidragBehandlingApiV1";
import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { BidragCommonsProvider } from "../../api/BidragCommonsContext";
import { genererFnr } from "../../../playwright/testing/fnrGenerator.ts";
import { mockUseHentPersonData } from "../../../playwright/testing/mockPersonData.ts";
import { ExpandedRoles, type HeaderRolle, type SaksnummerRoller } from "./ExpandedRoles";

const identBm = genererFnr();
const identBp = genererFnr();
const identBa = genererFnr();

const lagRolle = (overrides: Partial<HeaderRolle>): HeaderRolle => ({
    id: 1,
    rolletype: Rolletype.BM,
    ident: identBm,
    navn: "Kari Nordmann",
    saksnummer: "2024/1",
    søknader: [],
    ...(overrides as Partial<RolleDto>),
});

const treRoller: SaksnummerRoller = {
    saksnummer: "2024/1",
    roller: [
        lagRolle({ id: 1, rolletype: Rolletype.BM, ident: identBm, navn: "Kari Nordmann" }),
        lagRolle({ id: 2, rolletype: Rolletype.BP, ident: identBp, navn: "Ola Nordmann" }),
        lagRolle({ id: 3, rolletype: Rolletype.BA, ident: identBa, navn: "Lille Nordmann" }),
    ],
};

/** Vanlig visning - BM, BP og barn i samme sak. */
export const TreRoller = () => (
    <BidragCommonsProvider
        useHentPersonData={mockUseHentPersonData({
            [identBm]: { ident: identBm, visningsnavn: "Kari Nordmann", fornavn: "Kari" },
            [identBp]: { ident: identBp, visningsnavn: "Ola Nordmann", fornavn: "Ola" },
            [identBa]: { ident: identBa, visningsnavn: "Lille Nordmann", fornavn: "Lille" },
        })}
    >
        <ExpandedRoles saksnummerRoller={treRoller} />
    </BidragCommonsProvider>
);

/** Ingen ekspandert saksnummer - komponenten skal ikke rendre noe. */
export const IngenEkspandert = () => (
    <BidragCommonsProvider useHentPersonData={mockUseHentPersonData({})}>
        <ExpandedRoles saksnummerRoller={undefined} />
    </BidragCommonsProvider>
);

/** Én rolle - enkleste ikke-tomme tilfelle. */
export const EnRolle = () => (
    <BidragCommonsProvider
        useHentPersonData={mockUseHentPersonData({
            [identBm]: { ident: identBm, visningsnavn: "Kari Nordmann", fornavn: "Kari" },
        })}
    >
        <ExpandedRoles
            saksnummerRoller={{
                saksnummer: "2024/1",
                roller: [lagRolle({ id: 1, rolletype: Rolletype.BM, ident: identBm, navn: "Kari Nordmann" })],
            }}
        />
    </BidragCommonsProvider>
);
