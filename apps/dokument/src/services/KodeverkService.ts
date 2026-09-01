import { DefaultRestService } from "@bidrag/common";
import type { LandkodeLand, PostnummerPoststed } from "../types/api/KodeverkTypes";

export default class KodeverkService extends DefaultRestService {
    constructor() {
        super("self");
    }
    async getPostnummere(): Promise<PostnummerPoststed[]> {
        return this.get<PostnummerPoststed[]>("/api/kodeverk/postnummere").then((res) => res.data);
    }

    async getLandkoder(): Promise<LandkodeLand[]> {
        return this.get<PostnummerPoststed[]>("/api/kodeverk/landkoder").then((res) => res.data);
    }
}
