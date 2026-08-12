import {DefaultRestService} from "@bidrag/common";

export interface LandkodeLand {
    [landkode: string]: string;
}

export default class KodeverkApi extends DefaultRestService {
    constructor() {
        super("self");
    }

    async getLandkoder(): Promise<LandkodeLand[]> {
        return this.get<LandkodeLand[]>("/api/kodeverk/landkoder3").then((res) => res.data);
    }
}
