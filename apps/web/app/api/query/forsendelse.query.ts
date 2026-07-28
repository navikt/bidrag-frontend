import { BIDRAG_FORSENDELSE_API } from "@bidrag/api";
import { SecureLoggerService } from "@bidrag/common";
import { mutationOptions } from "@tanstack/react-query";
import { withQueryErrorHandling } from "~/api/query/withQueryErrorHandling.ts";

export async function utførSlettForsendelseMutationFn(forsendelseId: string) {
    return withQueryErrorHandling(
        "utførSlettForsendelse",
        async () => {
            if (!forsendelseId) throw new Error("forsendelseId is required");
            const forsendelseIdMedPrefiks = forsendelseId.startsWith("BIF-") ? forsendelseId : `BIF-${forsendelseId}`;
            const { data } = await BIDRAG_FORSENDELSE_API.api.utforAvvik(forsendelseIdMedPrefiks, {
                avvikType: "SLETT_JOURNALPOST",
                detaljer: {},
            });
            await SecureLoggerService.info(`Utført sletting av forsendelse  ${forsendelseId}`);
            return data;
        },
        { forsendelseId },
    );
}

export function utførSlettForsendelse(forsendelseId: string) {
    return mutationOptions({
        mutationKey: ["utførSlettForsendelse", forsendelseId],
        mutationFn: () => utførSlettForsendelseMutationFn(forsendelseId),
    });
}
