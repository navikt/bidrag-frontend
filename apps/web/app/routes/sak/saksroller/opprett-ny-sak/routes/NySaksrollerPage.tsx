import OpprettSakFlyt from "../OpprettSakFlyt";
import { SaksrolleroversiktProvider } from "../saksrolleroversiktContext";

export default function NySaksrollerPage() {
    return (
        <SaksrolleroversiktProvider>
            <div className="max-w-5xl mx-auto">
                <OpprettSakFlyt />
            </div>
        </SaksrolleroversiktProvider>
    );
}
