import { Outlet } from "react-router";

export function EndringsloggLayout() {
    return (
        <div className={"container mx-auto p-6"}>
            <Outlet />
        </div>
    );
}
