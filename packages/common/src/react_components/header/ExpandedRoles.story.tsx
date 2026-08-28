/**
 * Stories for `ExpandedRoles` - rollekort-panelet som vises under
 * saksnummer-fanene i `SakHeader`. Samme story + gallery-mønster som
 * `RolleCard.story.tsx`: en mocket `BidragCommonsProvider` rundt komponenten,
 * ingen Storybook, ingen @playwright/experimental-ct-react.
 */
import type { RolleDto } from "@bidrag/api/BidragBehandlingApiV1";
import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";
import { BidragCommonsProvider } from "../../api/BidragCommonsContext";
import { mockUseHentPersonData } from "../../../playwright/testing/mockPersonData";
import { ExpandedRoles, type HeaderRolle, type SaksnummerRoller } from "./ExpandedRoles";

const lagRolle = (overrides: Partial<HeaderRolle>): HeaderRolle => ({
    id: 1,
    rolletype: Rolletype.BM,
    ident: "12345678910",
    navn: "Kari Nordmann",
    saksnummer: "2024/1",
    søknader: [],
    ...(overrides as Partial<RolleDto>),
});

const treRoller: SaksnummerRoller = {
    saksnummer: "2024/1",
    roller: [
        lagRolle({ id: 1, rolletype: Rolletype.BM, ident: "12345678910", navn: "Kari Nordmann" }),
        lagRolle({ id: 2, rolletype: Rolletype.BP, ident: "10987654321", navn: "Ola Nordmann" }),
        lagRolle({ id: 3, rolletype: Rolletype.BA, ident: "01012345678", navn: "Lille Nordmann" }),
    ],
};

/** Vanlig visning - BM, BP og barn i samme sak. */
export const TreRoller = () => (
    <BidragCommonsProvider
        useHentPersonData={mockUseHentPersonData({
            "12345678910": { ident: "12345678910", visningsnavn: "Kari Nordmann", fornavn: "Kari" },
            "10987654321": { ident: "10987654321", visningsnavn: "Ola Nordmann", fornavn: "Ola" },
            "01012345678": { ident: "01012345678", visningsnavn: "Lille Nordmann", fornavn: "Lille" },
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
            "12345678910": { ident: "12345678910", visningsnavn: "Kari Nordmann", fornavn: "Kari" },
        })}
    >
        <ExpandedRoles
            saksnummerRoller={{
                saksnummer: "2024/1",
                roller: [lagRolle({ id: 1, rolletype: Rolletype.BM, ident: "12345678910", navn: "Kari Nordmann" })],
            }}
        />
    </BidragCommonsProvider>
);
