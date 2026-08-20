import { Outlet } from "react-router";

export default function EndringsloggLayout() {
    return (
        <div className={"container mx-auto p-6"}>
            <Outlet />
        </div>
    );
}
