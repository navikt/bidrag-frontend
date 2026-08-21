import { Rolletype } from "@bidrag/api/BidragBehandlingApiV1";

const ROLE_ORDER = {
    [Rolletype.BM]: 1,
    [Rolletype.BP]: 2,
    [Rolletype.BA]: 3,
};
export const sortBehandlingRoller = (rolleA, rolleB) => {
    const orderDiff = ROLE_ORDER[rolleA.rolletype] - ROLE_ORDER[rolleB.rolletype];
    if (orderDiff !== 0) return orderDiff;

    const dateA = new Date(rolleA.fødselsdato).getTime();
    const dateB = new Date(rolleB.fødselsdato).getTime();
    const dateDiff = dateA - dateB;

    if (dateDiff !== 0) return dateDiff;

    return rolleA.navn.localeCompare(rolleB.navn, "no", { sensitivity: "base" });
};
