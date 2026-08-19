import type {SamhandlerDto, SamhandlerSok} from "@bidrag/api/SamhandlerApi";
import {Broadcast, BroadcastNames, useBisysLink} from "@bidrag/common";
import {ExternalLinkIcon, HandFingerIcon, PencilIcon} from "@navikt/aksel-icons";
import {
    Alert,
    BodyLong,
    BodyShort,
    Box,
    Button,
    Heading,
    HGrid,
    Label,
    Link as DsLink,
    Modal,
    Select,
    Table,
    Tag,
    TextField,
    VStack,
} from "@navikt/ds-react";
import {memo, useState} from "react";
import {FormProvider, useForm} from "react-hook-form";
import {Link, useSearchParams} from "react-router";
import {QueryErrorWrapper} from "./QueryErrorBoundary";
import SamhandlerForm from "./SamhandlerForm";
import {sortInAlphabeticOrder} from "./utils/sorting";
import styles from './SamhandlerSøk.module.css'
import {
    kodeTilVisningsnavn,
    landkodeTilVisningsnavn,
    useHentLandkoder,
    useHentSamhandler,
    useHentSamhandlersSaker,
    useHentVisningsnavn,
    useOppdaterSamhandler,
    useOpprettSamhandler,
} from "./utils/useApiData";

export interface Samhandler extends SamhandlerDto {
    addedManually?: boolean;
}

const EditButton = ({
                        samhandler,
                        onSamhandlerUpdated,
                    }: {
    samhandler: SamhandlerDto;
    onSamhandlerUpdated: (samhandler: Samhandler) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const oppdaterSamhandler = useOppdaterSamhandler();

    return (
        <>
            <Button
                size="xsmall"
                variant="tertiary"
                icon={<PencilIcon title="Rediger"/>}
                onClick={() => setIsOpen(true)}
            ></Button>
            {isOpen && (
                <Modal
                    className={styles.modal}
                    open
                    onClose={() => setIsOpen(false)}
                    header={{heading: `Samhandler ${samhandler.samhandlerId}`}}
                >
                    <SamhandlerForm
                        mutation={oppdaterSamhandler}
                        samhandler={samhandler}
                        onSuccess={onSamhandlerUpdated}
                        onClose={() => setIsOpen(false)}
                        typeOfAction="edit"
                    />
                </Modal>
            )}
        </>
    );
};

const OpprettSamhandlerButton = ({
                                     onSamhandlerCreated,
                                 }: {
    onSamhandlerCreated: (samhandler: Samhandler) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const opprettSamhandler = useOpprettSamhandler();

    return (
        <>
            <Button variant="tertiary" size="small" onClick={() => setIsOpen(true)}>
                + Opprett ny samhandler
            </Button>
            {isOpen && (
                <Modal open onClose={() => setIsOpen(false)} header={{heading: "Opprett samhandler"}}>
                    <SamhandlerForm
                        mutation={opprettSamhandler}
                        onSuccess={onSamhandlerCreated}
                        onClose={() => setIsOpen(false)}
                        typeOfAction="create"
                    />
                </Modal>
            )}
        </>
    );
};

const AntallSaker = ({samhandlerId}: { samhandlerId: string }) => {
    const {data} = useHentSamhandlersSaker(samhandlerId);

    return <BodyShort>{data.antallSaker}</BodyShort>;
};

const SakListe = ({samhandlerId}: { samhandlerId: string }) => {
    const {data} = useHentSamhandlersSaker(samhandlerId);

    const {bisysUrl, setBisysLinkTarget} = useBisysLink();

    return (
        <VStack gap="space-4" align="start">
            {data.saksnummere.map((saksnummer) => {
                setBisysLinkTarget("sak", {saksnr: saksnummer});
                if (!bisysUrl) return <span key={saksnummer}>{saksnummer}</span>;

                return (
                    <DsLink
                        key={saksnummer}
                        variant="action"
                        href={bisysUrl}
                        target="_blank"
                    >
                        {saksnummer} <ExternalLinkIcon aria-hidden/>
                    </DsLink>
                );
            })}
        </VStack>
    );
};

const ExpandableContent = memo(
    ({samhandler, index}: { samhandler: Samhandler; index: number }) => {
        const evenRow = index === 0 || index % 2 === 0;
        const background = evenRow ? "neutral-soft" : "default";
        return (
            <HGrid gap="space-4">
                <Box padding="space-4" background={background}>
                    <Heading size="xsmall" className="mb-2">
                        Adresse
                    </Heading>
                    <HGrid gap="space-4" columns={{xs: 1, sm: 2, md: 3}}>
                        <div>
                            <Label size="small">Adresselinje2</Label>
                            <BodyShort size="small">{samhandler.adresse?.adresselinje2}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Adresselinje3</Label>
                            <BodyShort size="small">{samhandler.adresse?.adresselinje3}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Postnummer</Label>
                            <BodyShort size="small">{samhandler.adresse?.postnummer}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Poststed</Label>
                            <BodyShort size="small">{samhandler.adresse?.poststed}</BodyShort>
                        </div>
                    </HGrid>
                </Box>

                <Box padding="space-4" background={background}>
                    <Heading size="xsmall" className="mb-2">
                        Kontaktinformasjon
                    </Heading>
                    <HGrid gap="space-4" columns={{xs: 1, sm: 2, md: 3}}>
                        <div>
                            <Label size="small">E-post</Label>
                            <BodyShort size="small">{samhandler.kontaktEpost}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Telefon</Label>
                            <BodyShort size="small">{samhandler.kontaktTelefon}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Kontaktperson</Label>
                            <BodyShort size="small">{samhandler.kontaktperson}</BodyShort>
                        </div>
                    </HGrid>
                </Box>

                <Box padding="space-4" background={background}>
                    <Heading size="xsmall" className="mb-2">
                        Kontoopplysninger
                    </Heading>
                    <HGrid gap="space-4" columns={{xs: 1, sm: 2, md: 3}}>
                        <div>
                            <Label size="small">Bankkode</Label>
                            <BodyShort size="small">{samhandler.kontonummer?.bankCode}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Banknavn</Label>
                            <BodyShort size="small">{samhandler.kontonummer?.banknavn}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Iban</Label>
                            <BodyShort size="small">{samhandler.kontonummer?.iban}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Landkode</Label>
                            <BodyShort size="small">
                                {landkodeTilVisningsnavn(samhandler.kontonummer?.landkodeBank)}
                            </BodyShort>
                        </div>
                        <div>
                            <Label size="small">Norsk kontonummer</Label>
                            <BodyShort size="small">{samhandler.kontonummer?.norskKontonummer}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Swift</Label>
                            <BodyShort size="small">{samhandler.kontonummer?.swift}</BodyShort>
                        </div>
                        <div>
                            <Label size="small">Valuta</Label>
                            <BodyShort size="small">
                                {kodeTilVisningsnavn(samhandler.kontonummer?.valutakode)}
                            </BodyShort>
                        </div>
                    </HGrid>
                </Box>

                <div>
                    <Label size="small">Språk</Label>
                    <BodyShort size="small">{kodeTilVisningsnavn(samhandler.språk)}</BodyShort>
                </div>

                <div>
                    <Label size="small">Notat</Label>
                    <BodyLong size="small">{samhandler.notat}</BodyLong>
                </div>
                <div>
                    <Label size="small">Saker registrert som RM</Label>
                    <QueryErrorWrapper>
                        {samhandler.samhandlerId && <SakListe samhandlerId={samhandler.samhandlerId}/>}
                    </QueryErrorWrapper>
                </div>
            </HGrid>
        );
    },
    (prevProps, nextProps) =>
        prevProps.samhandler.samhandlerId === nextProps.samhandler.samhandlerId && prevProps.index === nextProps.index,
);

export default function SamhandlerSøk() {
    const [searchParams] = useSearchParams();
    const windowId = searchParams.get("windowId");
    const [searchResults, setSearchResults] = useState<Samhandler[]>([]);
    const searchMutation = useHentSamhandler();
    const {data: visningsnavn} = useHentVisningsnavn();
    const landkoder = useHentLandkoder();

    const visningsnavnLandkoder = landkoder
        .map((landkode) => ({
            landkode: landkode,
            visningsnavn: visningsnavn[landkode] ?? "Ukjent",
        }))
        .filter((lankode) => !!lankode.visningsnavn)
        .sort((a, b) => sortInAlphabeticOrder(a.visningsnavn, b.visningsnavn));

    const formMethods = useForm<SamhandlerSok>({
        defaultValues: {
            ident: "",
            offentligId: "",
            navn: "",
            postnummer: "",
            poststed: "",
            norskkontonr: "",
            iban: "",
            swift: "",
            banknavn: "",
            banklandkode: "",
            bankcode: "",
        },
    });

    const onSearch = (payload: SamhandlerSok) => {
        searchMutation.mutate(payload, {
            onSuccess: (response) => {
                setSearchResults(response.samhandlere);
            },
        });
    };

    const onSelect = (samhandler: Samhandler) => {
        if (!windowId) return;
        const data = Broadcast.convertToBroadcastMessage(windowId, samhandler);
        Broadcast.sendBroadcast(BroadcastNames.SAMHANDLERSOK_RESULT_EVENT, data);
    };

    const onSamhandlerCreated = (samhandler: Samhandler) => {
        setSearchResults([{...samhandler, addedManually: true}, ...searchResults]);
    };

    const onSamhandlerUpdated = (samhandler: Samhandler) => {
        const updatedSamhandlerIndex = searchResults.findIndex((s) => s.samhandlerId === samhandler.samhandlerId);
        setSearchResults(searchResults.toSpliced(updatedSamhandlerIndex, 1, samhandler));
    };

    return (
        <VStack gap={'space-32'} marginBlock={'space-32 space-0'}>
            <Heading level="1" size="large">
                Søk samhandler
            </Heading>
            <FormProvider {...formMethods}>
                <form onSubmit={formMethods.handleSubmit(onSearch)}>
                    <Box background="neutral-soft" padding="space-8" className="grid gap-6">
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={{xs: 1, sm: 2, md: 3}}>
                            <TextField {...formMethods.register("ident")} label="Ident" size="small"/>
                            <TextField {...formMethods.register("offentligId")} label="OffentligId" size="small"/>
                        </HGrid>
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={{xs: 1, sm: 2, md: 3}}>
                            <TextField {...formMethods.register("navn")} label="Navn" size="small"/>
                            <TextField {...formMethods.register("postnummer")} label="Postnummer" size="small"/>
                            <TextField {...formMethods.register("poststed")} label="Poststed" size="small"/>
                        </HGrid>
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={{xs: 1, sm: 2, md: 3}}>
                            <TextField {...formMethods.register("norskkontonr")} label="Kontonummer" size="small"/>
                            <TextField {...formMethods.register("iban")} label="Kontoopplysninger iban" size="small"/>
                            <TextField {...formMethods.register("swift")} label="Swift" size="small"/>
                        </HGrid>
                        <HGrid gap={{xs: "space-8", md: "space-12"}} columns={{xs: 1, sm: 2, md: 3}}>
                            <TextField {...formMethods.register("banknavn")} label="Banknavn" size="small"/>
                            <Select {...formMethods.register("banklandkode")} label="Landkode" size="small">
                                <option value="">- Velg landkode -</option>
                                {visningsnavnLandkoder.map((landkode) => (
                                    <option key={landkode.landkode} value={landkode.landkode}>
                                        {landkode.visningsnavn}
                                    </option>
                                ))}
                            </Select>
                            <TextField {...formMethods.register("bankcode")} label="Bankkode" size="small"/>
                        </HGrid>
                        <div className="flex flex-wrap flex-row gap-4 items-start">
                            <Button variant="primary" size="small" loading={searchMutation.isPending}>
                                Søk
                            </Button>
                            <Button variant="tertiary" size="small" type="button" onClick={() => formMethods.reset()}>
                                Nullstill
                            </Button>
                        </div>
                        {searchMutation.error && <Alert variant="error">Feil ved innhenting</Alert>}
                    </Box>
                </form>
            </FormProvider>
            <div className="flex flex-wrap flex-row gap-4 items-center justify-between">
                <Heading level="3" size="small">
                    Resultat
                </Heading>
                <OpprettSamhandlerButton onSamhandlerCreated={onSamhandlerCreated}/>
            </div>
            {searchMutation.isSuccess && searchResults.length < 1 && <BodyShort size="medium">Ingen treff</BodyShort>}
            {searchResults.length > 0 && (
                <div className="overflow-x-auto whitespace-nowrap">
                    <Table zebraStripes size="small" className="table w-full">
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell scope="col" textSize="small">
                                    Ident
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    OffentligId
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    OffentligId type
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    Kreditortype
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    Navn
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    Addresse
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small">
                                    Land
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small" align="right">
                                    Antall saker registrert som RM
                                </Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small" className="w-[40px]"></Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small" className="w-[40px]"></Table.HeaderCell>
                                <Table.HeaderCell scope="col" textSize="small" className="w-[20px]"></Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {searchResults.map((samhandler, index) => {
                                return (
                                    <Table.ExpandableRow
                                        key={samhandler.samhandlerId}
                                        content={<ExpandableContent samhandler={samhandler} index={index}/>}
                                        togglePlacement="right"
                                    >
                                        <Table.HeaderCell scope="row" textSize="small">
                                            <Link to={`/samhandler/${samhandler.samhandlerId}`}>
                                                {samhandler.samhandlerId}
                                            </Link>
                                            {samhandler.addedManually && (
                                                <Tag variant="info" size="xsmall" className="ml-2">
                                                    Ny
                                                </Tag>
                                            )}
                                        </Table.HeaderCell>
                                        <Table.DataCell textSize="small">{samhandler.offentligId}</Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            {kodeTilVisningsnavn(samhandler.offentligIdType)}
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            {kodeTilVisningsnavn(samhandler.områdekode)}
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">{samhandler.navn}</Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            {samhandler.adresse?.adresselinje1}
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            {landkodeTilVisningsnavn(samhandler.adresse?.land)}
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small" align="right">
                                            <QueryErrorWrapper>
                                                {samhandler.samhandlerId && (
                                                    <AntallSaker samhandlerId={samhandler.samhandlerId}/>
                                                )}
                                            </QueryErrorWrapper>
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            <EditButton
                                                samhandler={samhandler}
                                                onSamhandlerUpdated={onSamhandlerUpdated}
                                            />
                                        </Table.DataCell>
                                        <Table.DataCell textSize="small">
                                            <Button
                                                size="xsmall"
                                                variant="tertiary"
                                                icon={<HandFingerIcon title="Velg"/>}
                                                onClick={() => onSelect(samhandler)}
                                            >
                                                Velg
                                            </Button>
                                        </Table.DataCell>
                                    </Table.ExpandableRow>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </div>
            )}
        </VStack>
    );
}
