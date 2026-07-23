import type {Route} from "../../../../.react-router/types/app/routes/admin/+types";

export default function NyEndringsloggPage({params}: Route.ComponentProps) {
    console.log(params);
    return (
        <div>Ny endringslogg</div>

    );
}
