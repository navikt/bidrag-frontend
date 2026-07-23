import type {Route} from "./+types/index";

export default function AdminIndex({params}: Route.ComponentProps) {
    console.log(params);
    return (
        <div>Hallo admin side</div>

    );
}
