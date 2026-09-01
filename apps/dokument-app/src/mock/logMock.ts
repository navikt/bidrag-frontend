import { type RestHandler, type RestRequest, rest } from "msw";

export default function logMock(): RestHandler[] {
    return [
        rest.post(`/log`, (req: RestRequest, res, ctx) => {
            console.log("Logging", req.json());
            return res(ctx.status(200), ctx.body("some token"));
        }),
    ];
}
