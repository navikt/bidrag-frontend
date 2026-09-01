import type { MockedResponse, ResponseFunction, RestContext } from "msw";

import type { ResponseData } from "./types";

export function mapToMockedResponse(
    res: ResponseFunction,
    ctx: RestContext,
    responseData?: ResponseData<unknown>,
): MockedResponse<unknown> | Promise<MockedResponse<unknown>> {
    return res(ctx.status(responseData?.status ?? 404), ctx.json(responseData?.data));
}
