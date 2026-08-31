import type { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
export default function useOnMutationSuccess(mutationFn: UseMutationResult, successFn: () => void) {
    const prevStatus = useRef(mutationFn.status);
    useEffect(() => {
        if (prevStatus.current !== "success" && mutationFn.status === "success") {
            successFn?.();
        }
        prevStatus.current = mutationFn.status;
    }, [mutationFn.status]);
}
