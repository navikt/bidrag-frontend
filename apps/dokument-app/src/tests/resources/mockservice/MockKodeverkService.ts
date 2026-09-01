import sinon from "sinon";

import KodeverkService from "../../../services/KodeverkService";

export default function mockKodeverkService(sinonSandbox = sinon.createSandbox()) {
    sinonSandbox.stub(KodeverkService.prototype, "getLandkoder").callsFake(() => {
        return Promise.resolve([
            {
                NO: "Norge",
            },
            {
                SE: "Sverige",
            },
        ]);
    });
    sinonSandbox.stub(KodeverkService.prototype, "getPostnummere").callsFake(() => {
        return Promise.resolve([
            {
                "3000": "Drammen",
            },
            {
                "9000": "Alta",
            },
            {
                "0000": "Oslo",
            },
            {
                "0001": "Oslo",
            },
            {
                "0002": "Oslo",
            },
        ]);
    });
    return sinonSandbox;
}
