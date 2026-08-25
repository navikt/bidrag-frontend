import { useHentPersonData } from "../hooks/useApiData";

export const PersonNavn = ({ ident, navn, bold }: { ident?: string; navn?: string; bold?: boolean }) => {
    const { data: personData } = useHentPersonData(navn ? undefined : ident);

    return <span className={`personnavn ${bold ? "font-ax-bold" : ""}`}>{navn ?? personData.visningsnavn}</span>;
};
