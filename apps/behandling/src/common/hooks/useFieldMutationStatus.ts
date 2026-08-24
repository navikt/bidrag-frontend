import type { MutationStatus, UseMutationResult } from "@tanstack/react-query";

import type { BaseMutationVariables } from "./useApiData";

export const useFieldMutationStatus = <
    TData = unknown,
    TError = unknown,
    TVariables extends BaseMutationVariables = BaseMutationVariables,
    TContext = unknown,
>(
    mutation: UseMutationResult<TData, TError, TVariables, TContext>,
    fieldName: string,
): MutationStatus => {
    const isThisField = mutation.variables?.triggeredBy === fieldName;

    if (!isThisField) {
        return "idle";
    }

    return mutation.status;
};
