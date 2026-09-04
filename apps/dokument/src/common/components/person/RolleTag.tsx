import type { Rolletype } from "@bidrag/api/SakApi";

interface RolleTagProps {
    rolleType: Rolletype;
}
export default function RolleTag({ rolleType }: RolleTagProps) {
    return <span className={`select-none rolleTag ${rolleType}`}>{rolleType}</span>;
}
