import {Outlet} from "react-router";
import type { Route } from "./+types/EndringsloggLayout";

export default function EndringsloggLayout({params}: Route.ComponentProps) {
    return (
        <div className={'container mx-auto p-6'}>
            <Outlet/>
        </div>
    );
};
