import "./ForsendelseTittel.css";

import { Heading } from "@navikt/ds-react";

import { useHentForsendelseQuery } from "../../../hooks/useForsendelseApi";
export default function ForsendelseTittel() {
    const forsendelse = useHentForsendelseQuery();
    // const [editMode, setEditMode] = useState(false);
    // const [forsendelseTittel, setForsendelseTittel] = useState(forsendelse.tittel);

    // useEffect(() => {
    //     setForsendelseTittel(forsendelse.tittel);
    // }, [forsendelse.tittel]);

    // const enableEditMode = () => setEditMode(true);
    // const disableEditMode = () => setEditMode(false);
    // const onSubmit = (updatedTitle: string) => {
    //     setForsendelseTittel(updatedTitle);
    //     disableEditMode();
    // };

    return (
        <Heading spacing size={"large"}>
            {forsendelse.tittel}
        </Heading>
    );
    // return (
    //     <div>
    //         <div className={"w-max flex flex-row gap-[5px] max-w-[100%] forsendelse-tittel"}>
    //             {!editMode && (
    //                 <>
    //                     <Heading spacing size={"large"}>
    //                         {forsendelseTittel}{" "}
    //                     </Heading>

    //                     <Button
    //                         className="w-max h-max mt-1"
    //                         size="small"
    //                         variant="tertiary"
    //                         icon={<PencilIcon />}
    //                         onClick={enableEditMode}
    //                     >
    //                         Endre tittel
    //                     </Button>
    //                 </>
    //             )}
    //         </div>
    //         {editMode && (
    //             <EditForsendelseTitle onSubmit={onSubmit} onCancel={disableEditMode} defaultValue={forsendelseTittel} />
    //         )}
    //     </div>
    // );
}

// interface EditForsendelseTitleProps {
//     onSubmit: (updatedTitle: string) => void;
//     onCancel: () => void;
//     defaultValue: string;
// }
// function EditForsendelseTitle({ onCancel, onSubmit, defaultValue }: EditForsendelseTitleProps) {
//     const bidragForsendelseApi = useBidragForsendelseApi();
//     const forsendelse = useHentForsendelseQuery();
//     const [updatedTitle, setUpdatedTitle] = useState<string>();
//     const queryClient = useQueryClient();
//     const isCanceled = useRef(false);
//     const updateTitleMutation = useMutation<OppdaterForsendelseResponse, null, { title: string }>({
//         mutationFn: () =>
//             bidragForsendelseApi.api
//                 .oppdaterForsendelse(forsendelse.forsendelseId, {
//                     dokumenter: [],
//                 })
//                 .then((res) => res.data),
//         onSuccess: (data) => onSubmit(data.tittel ?? defaultValue),
//     });
//
//     function onChange(e: React.ChangeEvent<HTMLInputElement>) {
//         const value = e.target.value;
//         setUpdatedTitle(value);
//     }
//     async function _onSubmit() {
//         if (isCanceled.current) return;
//         if (updatedTitle) {
//             await updateTitleMutation.mutate({ title: updatedTitle });
//             queryClient.refetchQueries({ queryKey: UseForsendelseApiKeys.hentForsendelse() });
//         } else {
//             onSubmit(defaultValue);
//         }
//     }
//
//     function renderError() {
//         if (updateTitleMutation.isError === true) {
//             const error = updateTitleMutation.error as AxiosError;
//             const errorMessage = error?.response?.headers?.["warning"];
//             return (
//                 <Alert
//                     className="w-max mb-2"
//                     variant="error"
//                     size="small"
//                 >{`Kunne ikke lagre tittel: ${errorMessage}`}</Alert>
//             );
//         }
//     }
//     return (
//         <div>
//             <div className="flex flex-row gap-[5px] mb-4">
//                 <TextField
//                     onKeyDown={(e) => {
//                         if (e.key.toLowerCase() === "enter") _onSubmit();
//                         if (e.key.toLowerCase() === "escape") onCancel();
//                     }}
//                     autoFocus
//                     disabled={updateTitleMutation.isPending}
//                     defaultValue={defaultValue}
//                     name="tittel"
//                     size="small"
//                     label="Navn på forsendelsen"
//                     onChange={onChange}
//                     className="w-2/3"
//                 />
//                 <div className="self-end">
//                     <Button
//                         loading={updateTitleMutation.isPending}
//                         size="small"
//                         variant="tertiary"
//                         icon={<CloudUpIcon />}
//                         onClick={_onSubmit}
//                     >
//                         Lagre
//                     </Button>
//                     <Button
//                         disabled={updateTitleMutation.isPending}
//                         size="small"
//                         variant="tertiary"
//                         icon={<XMarkIcon />}
//                         onClick={onCancel}
//                     >
//                         Avbryt
//                     </Button>
//                 </div>
//             </div>
//             {renderError()}
//         </div>
//     );
// }
