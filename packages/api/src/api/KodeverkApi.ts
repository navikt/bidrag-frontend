import {ContentType, HttpClient} from "./SakApi.ts";

export interface LandkodeLand {
    [landkode: string]: string;
}

export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    kodeverk = {
        getLandkoder: (): Promise<LandkodeLand[]> =>
            this.request<LandkodeLand[]>({
                path: "/landkoder3",
                method: "GET",
                secure: true,
                type: ContentType.Json,
            }).then((res) => {
                console.log(res);
                return res.data;
            })
    }
}
