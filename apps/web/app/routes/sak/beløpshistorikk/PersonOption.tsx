import {useBidragCommons} from "@bidrag/common";

interface PersonOptionProps {
    personident: string;
}
export function PersonOption({ personident }: PersonOptionProps) {
    const { useHentPersonData } = useBidragCommons();
    const { data: persondata } = useHentPersonData(personident);
    return (
        <option key={personident} value={personident}>
            {persondata.visningsnavn}
        </option>
    );
}
