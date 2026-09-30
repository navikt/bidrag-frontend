# Saksroller: regler og testscenarier

Oversikt for funksjonelle testere over hvilke parter en sak kan ha, hva som stopper lagring, og hvilke scenarier de automatiske testene dekker. Gjelder opprett sak og endre roller i bidrag-frontend.

## Ord og forkortelser

| Ord | Betyr |
|---|---|
| BP | Bidragspliktig |
| BM | Bidragsmottaker |
| BA | Barn i saken |
| RM | Reell mottaker. Den som faktisk får bidraget for et barn: barnet selv eller en samhandler. |
| Samhandler | Institusjon eller person med samhandler-ID, for eksempel en kommune |
| Ukjent part | BP eller BM er registrert som ukjent, uten fødselsnummer |
| Myndig barn | Barnet er 18 år eller eldre i dag |
| Arbeidsfordeling | Koden saken opprettes med. bidrag-sak lagrer koden på saken. Den bestemmer sakstypen, og sakstypen endres aldri. |
| Eierfogd | Enheten som eier saken. Arbeidsfordelingen og partenes bosted avgjør hvilken enhet det blir. |

## Regler per sakstype

Reglene gjelder både når saken opprettes og når rollene endres, med unntakene som står i tabellen.

| Regel | Barnebidrag | Farskap | Oppfostringsbidrag | Ektefellebidrag |
|---|---|---|---|---|
| Arbeidsfordeling | EEN (eierenhet), og BBF (barnebortføring), INH (settekontor) og RKS (reisekostnad) | FRS | OPS | EFS |
| Bidragspliktig | Må registreres eller settes som ukjent ved opprett | Registreres ikke ved opprett | Påkrevd | Påkrevd |
| Bidragsmottaker | Må registreres eller settes som ukjent ved opprett | Påkrevd | Registreres ikke | Påkrevd |
| Barn | Minst ett når BM er ukjent. Uten barn går når BM er kjent. | Nøyaktig ett | Minst ett | Ingen barn. Kan ikke endres i rollebildet. |
| RM | Påkrevd for myndige barn og når BM er ukjent. Ellers valgfri. | Påkrevd for myndige barn. Vises ikke for yngre barn ved opprett. | Påkrevd for alle barn, og må være samhandler | Ikke aktuelt |

Reglene om personer, tilgang og eksisterende sak står i neste tabell. Der står det også hvilke sakstyper og løsninger de gjelder for.

## Hvor reglene gjelder i dag

Tabellen sammenligner reglene i ny flyt (bidrag-frontend) med løsningene som er i produksjon. En regel stopper lagring eller gir advarsel. Hva saksbehandler kan gjøre i skjermbildet står i neste del. Sjekket 30.09.2026.

Opprett sak-modalen i produksjon åpnes fra behandling og dokument. Den oppretter bare barnebidragssaker og henter foreldre og barn fra registrerte relasjoner. Saksbehandler kan ikke søke opp andre personer der.

- **Stopper:** lagring eller opprettelse går ikke.
- **Påminnelse:** melding vises, men lagring går.
- **Nei:** regelen sjekkes ikke.
- **Ikke mulig:** situasjonen kan ikke oppstå i løsningen.

| Regel | Ny flyt, opprett | Ny flyt, endre | Bisys, opprett | Bisys, endre | Opprett sak-modal | bidrag-sak (backend) |
|---|---|---|---|---|---|---|
| RM for myndig barn | Stopper i barnebidrag, farskap og oppfostringsbidrag | Stopper i barnebidrag, farskap og oppfostringsbidrag | Påminnelse når barnet legges til | Påminnelse når barnet legges til | Nei, backend stopper | Stopper, både ved opprett og endring |
| RM når BM er ukjent | Stopper i barnebidrag, for alle barn | Stopper i barnebidrag, for alle barn | Stopper, for alle barn | Stopper, for alle barn | Stopper, eller saksbehandler bekrefter at RM legges til senere | Stopper ved opprett |
| RM i oppfostringsbidrag | Stopper for alle barn. RM må være samhandler. | Stopper for alle barn. RM må være samhandler. | Stopper, fordi BM mangler | Stopper, fordi BM mangler | Ikke mulig | Stopper ved opprett, fordi BM mangler |
| Minst ett barn | Stopper i farskap og oppfostringsbidrag. I barnebidrag bare når BM er ukjent. | Stopper i farskap og oppfostringsbidrag. I barnebidrag bare når BM er ukjent. | Stopper når BM er ukjent | Stopper når BM er ukjent | Stopper når BM er ukjent | Nei |
| Farskap gjelder bare ett barn | Kan ikke skje, fordi et nytt barn erstatter det forrige | Stopper | Nei | Nei | Ikke mulig | Nei |
| Påkrevd forelder | Ektefellebidrag: BP og BM. Oppfostringsbidrag: BP. Farskap: BM. Barnebidrag: BP og BM må registreres eller settes som ukjent. | Ektefellebidrag: BP og BM. Oppfostringsbidrag: BP. Farskap: BM. Barnebidrag: ingen krav. | BP og BM må være registrert eller satt som ukjent | BP og BM må være registrert eller satt som ukjent | Rolle må velges for foreldrene når modalen åpnes fra et barn | Nei |
| Samme person som BP og BM | Stopper i barnebidrag og ektefellebidrag. Farskap og oppfostringsbidrag har bare én forelder ved opprett. | Stopper | Stopper, samme person kan ikke ha flere roller | Stopper, samme person kan ikke ha flere roller | Ikke mulig | Nei |
| Barn som også er forelder i saken | Stopper. Ikke aktuelt i ektefellebidrag. | Stopper. Personen er allerede i saken og kan ikke legges til som barn. | Stopper, samme person kan ikke ha flere roller | Stopper, samme person kan ikke ha flere roller | Ikke mulig | Nei |
| Barn som allerede er i saken | Stopper ved søk | Stopper ved søk | Stopper, samme person kan ikke ha flere roller | Stopper, samme person kan ikke ha flere roller | Ikke mulig | Nei |
| Barn over 24 år | Stopper ved søk. Vises ikke som forslag. | Stopper ved søk | Nei | Nei | Nei. Barna kommer fra registrerte relasjoner. | Nei |
| Sak finnes allerede med samme BP og BM | Stopper i barnebidrag og ektefellebidrag. Advarsel når motparten er ukjent. Sjekkes ikke i farskap og oppfostringsbidrag. | Ikke aktuelt | Advarsel, lagring går ved nytt trykk på lagre. Stopper hvis den andre saken har barn med løpende ytelser. | Samme som opprett | Nei | Nei |
| Barn uten registrert relasjon til BP eller BM | Advarsel. Saken kan opprettes. | Advarsel. Lagring er sperret til relasjonene er kontrollert. | Må bekreftes | Må bekreftes | Ikke mulig | Nei |
| Ukjent BM uten tilgang | Stopper. Bare i barnebidrag, fordi BM bare kan settes som ukjent der. | Nei | Ikke kartlagt | Ikke kartlagt | Stopper | Nei |

Bisys bruker de samme kontrollene når saken opprettes og når roller endres. Påminnelsen om RM for myndig barn vises bare for barn som legges til eller får endrede persondata.

bidrag-sak og Bisys bruker arbeidsfordelingen til å finne eierfogd, men ikke i kontrollene av roller. Reglene per sakstype finnes derfor bare i ny flyt.

Backend regner barnets alder ut fra dagens dato. Et barn som har fylt 18 år, krever derfor RM også når saken gjelder en periode før barnet fylte 18.

### Ikke avklart

Teamet har ikke avgjort om disse reglene skal stoppe lagring eller bare gi advarsel når roller endres:

- Farskap gjelder bare ett barn. Eldre farskapssaker med flere barn kan ikke lagres før barn fjernes.
- Påkrevd forelder per sakstype.
- Minst ett barn.

## Hva saksbehandler kan gjøre i ny flyt

Skjermbildet styrer også hva som er mulig. Noen regler slår derfor aldri inn, fordi saksbehandler ikke kan komme i den situasjonen.

| Handling | Opprett | Endre |
|---|---|---|
| Velge sakstype | Barnebidrag, farskap, oppfostringsbidrag eller ektefellebidrag. Ikke i innebygd skjema og modal, der er det barnebidrag. | Nei. Sakstypen er fast. |
| Velge nasjonal eller utland | Ja | Nei |
| Starte fra en person | Søk etter person og velg rollen BP, BM eller BA. I innebygd skjema og modal er personen fylt ut fra før. | Nei. Saken åpnes med rollene den har. |
| Bytte personen det ble startet fra | Ja, med «Endre». Ikke i innebygd skjema og modal. | Ikke aktuelt |
| Legge til BP eller BM | Velg fra forslag eller søk. I farskap bare BM, i oppfostringsbidrag bare BP. | Bare når BP eller BM mangler i saken |
| Bytte eller fjerne BP eller BM | Ja | Bare en BP eller BM som er lagt til i denne redigeringen |
| Sette BP eller BM som ukjent | I barnebidrag. Ukjent BM krever tilgang. | Nei. En part som mangler vises som «Ukjent - ikke registrert». |
| Legge til barn | Velg fra forslag, eller søk og legg til | Søk og legg til |
| Fjerne barn | Velg bort barnet. I innebygd skjema og modal kan barnet det ble startet fra ikke velges bort. | Bare barn som er lagt til i denne redigeringen |
| Antall barn | Farskap: ett, et nytt barn erstatter det forrige. Ektefellebidrag: ingen. Barnebidrag: ingen barn er lov når BM er kjent. | Ektefellebidragssaker kan ikke redigeres |
| Velge RM | Barnebidrag: BM, barnet selv, eller annen person eller samhandler. Farskap: bare for myndige barn. Oppfostringsbidrag: bare annen person eller samhandler. | De samme valgene. For farskap kan RM også velges for barn under 18 år. «Bidragsmottaker» er sperret når RM er påkrevd. |
| Endre eller fjerne RM | Ja, før saken opprettes | Ja |

## Testscenarier

Scenariene kjører automatisk som komponenttester. Overskriften sier hvordan saksbehandler startet: sakstype, nasjonal eller utland, og hvem saksbehandler søkte etter. Testfilene står under overskriften.

Alle testene bruker nasjonal sak. Bare én test bytter til utland.

### Opprett sak

#### Barnebidrag, nasjonal, søk etter BP

`opprett-ny-sak/flyt/Barnebidrag/Barnebidrag.ct.spec.ts`, `opprett-ny-sak/start/OpprettSakFlyt.ct.spec.ts`

| Utgangspunkt | Scenario | Forventet resultat |
|---|---|---|
| BP har barn med flere | Velg motpart | Bare felles barn med motparten vises. «Endre» viser alle barna igjen. |
| BP har barn, BM er ukjent | Se på barna | Advarsel om tilgang vises, men ikke advarsel om manglende relasjon |
| BP er ikke forelder til barnet | Velg barnet | Advarsel om manglende relasjon vises |
| BP har barn | Legg til et barn som allerede er valgt | Skjemaet beholder det som er fylt ut |
| BP har ingen registrerte barn | Søk opp og legg til BA | Barnet står i listen, er valgt og kan velges bort og inn igjen |
| BP har ingen registrerte barn | Legg til BA med én registrert forelder til | Den andre forelderen fylles ut automatisk, og saken opprettes |
| BP har ingen registrerte barn | Legg til BA med mer enn to registrerte foreldre | Feil om datakvalitet vises |
| Søk etter person | Velg rollen BP | Skjemaet fylles ut og søket tømmes |
| Søk etter person | Trykk Ctrl+ø | Navn skjules i valg, personkort, barn og oppsummering |
| Skjemaet er fylt ut | Søk etter BM og velg rollen BM | Du blir spurt før skjemaet nullstilles |
| Skjemaet er fylt ut | Bytt sakstype til ektefellebidrag | Du blir spurt før skjemaet nullstilles |
| Skjemaet er fylt ut | Bytt fra nasjonal til utland | Skjemaet nullstilles ikke |

#### Barnebidrag, nasjonal, søk etter BA under 18 år

`opprett-ny-sak/flyt/Barnebidrag/Barnebidrag.ct.spec.ts`

| Utgangspunkt | Scenario | Forventet resultat |
|---|---|---|
| Barnet har to registrerte foreldre | Velg barnet bort, velg BP | Den andre forelderen foreslås som BM |
| Barnet har to registrerte foreldre | Velg en forelder | Barna til forelderen hentes på nytt |
| Det finnes sak mellom partene | Velg foreldrene | Opprett er sperret |
| Saksbehandler mangler tilgang | Sett BM som ukjent og trykk Opprett | Melding om manglende tilgang. Saken sendes ikke. |

#### Barnebidrag, nasjonal, søk etter BA over 18 år

`opprett-ny-sak/flyt/Barnebidrag/Barnebidrag.ct.spec.ts`

| Utgangspunkt | Scenario | Forventet resultat |
|---|---|---|
| Barnet har ingen registrerte foreldre | Åpne skjemaet | Søk og «ukjent» i begge forelderkortene. Valg av RM er påkrevd. |

#### Farskap, nasjonal, søk etter BM

`opprett-ny-sak/flyt/EnPartMedBarn/Farskap.ct.spec.ts`, `opprett-ny-sak/start/OpprettSakFlyt.ct.spec.ts`

| Scenario | Forventet resultat |
|---|---|
| Trykk Opprett uten barn | «Du må velge minst ett barn.» |
| Velg barn og opprett | Saken opprettes med arbeidsfordeling FRS |
| Fjern BM og trykk Opprett | «Du må registrere bidragsmottaker» |
| Velg et barn til | Det nye barnet erstatter det forrige. Bare ett er valgt. |
| Se på barnekortet | Kopier-knapp og Modia-lenke står utenfor avkrysningen |
| Forslag til barn kan ikke hentes | Varsel vises. Varselet forsvinner når sakstypen byttes til barnebidrag. |

#### Oppfostringsbidrag, nasjonal, søk etter BP

`opprett-ny-sak/flyt/EnPartMedBarn/Oppfostringsbidrag.ct.spec.ts`

| Scenario | Forventet resultat |
|---|---|
| Velg barn | Tekst om at barnet selv ikke kan være RM. Feilen vises først når du trykker Opprett. |
| Trykk Opprett uten samhandler | «Du må registrere reell mottaker» |
| Søk opp samhandler som RM og opprett | Saken opprettes med arbeidsfordeling OPS og samhandleren som RM |

#### Ektefellebidrag, nasjonal, søk etter BP

`opprett-ny-sak/flyt/Ektefellebidrag/Ektefellebidrag.ct.spec.ts`, `opprett-ny-sak/start/OpprettSakFlyt.ct.spec.ts`

| Scenario | Forventet resultat |
|---|---|
| Velg foreslått ektefelle, og endre valget | Valgt ektefelle vises og kan byttes |
| Endre partene etter feil ved opprett | Feilmeldingen forsvinner |
| Endre BP | BP kan byttes |
| Søk etter BM med nytt fødselsnummer | Kortet viser informasjon om det nyeste fødselsnummeret |
| Hele flyten: velg sakstype, søk etter BP, søk etter BM og opprett | Saken opprettes |

#### Innebygd skjema, barnebidrag, nasjonal, person fylt ut fra før

`opprett-ny-sak/start/OpprettSakFlyt.ct.spec.ts`

Skjemaet er bygd inn i en annen side. Saksbehandler velger ikke sakstype og søker ikke etter personen det startes fra.

| Fylt ut fra før | Scenario | Forventet resultat |
|---|---|---|
| BP | Åpne skjemaet | Sakstype, søk og bytte av person vises ikke |
| BA | Åpne skjemaet | Barnet kan ikke velges bort |
| Person uten rolle | Velg rollen BM | Saksbehandler velger rollen selv |
| BA | Trykk Avbryt | Skjemaet lukkes |

#### Modal fra behandling og dokument, barnebidrag, nasjonal, BA under 18 år fylt ut fra før

`opprett-ny-sak/start/OpprettSakFlytModal.ct.spec.ts`

| Også fylt ut fra før | Scenario | Forventet resultat |
|---|---|---|
| BP | Trykk Opprett | Barn, BP og BM er fylt ut. Saksnummeret gis tilbake, og modalen lukkes. |
| BP | Backend svarer med feil | Feilen vises, og modalen står åpen |
| Ingen | Trykk Opprett uten å velge forelder | «Du må registrere bidragspliktig eller velge ukjent». Ingenting sendes. |
| Ingen | Trykk Avbryt | Modalen lukkes uten at sak opprettes |
| BP | Trykk Avbryt mens saken sendes | Avbryt er sperret |
| BP | Arbeidsfordelingen gir en annen enhet enn eierfogd | Avviket vises |
| Ingen | Ny flyt er skrudd av | Den nye modalen vises ikke |

### Endre roller

#### Barnebidragssak, nasjonal

`rollebilde/SaksrollerVisning.ct.spec.ts`, `rollebilde/barn/BarnVisning.ct.spec.ts`, `rollebilde/barn/LeggTilBarn.ct.spec.ts`

| Søk etter | Scenario | Forventet resultat |
|---|---|---|
| BA | Saken har ingen barn | Første barn kan legges til |
| Ingen | Åpne rollehistorikk | Historikk for forelder og barn vises i modal |
| RM og BA | Sett RM, legg til barn og lagre | Riktige roller sendes til backend |
| RM | Lagring feiler | Feilmelding vises |
| RM | Avbryt valg av RM | Ingenting lagres. Ny redigering fjerner meldingen. |
| BA | Fjern et nytt barn | Bare det nye barnet fjernes |
| RM | RM er påkrevd | Valget «Bidragsmottaker» er deaktivert |
| RM (samhandler) | Søk etter samhandler feiler, og nytt søk lykkes | Samhandleren vises |
| BA | Legg til barn | Du må søke først. Nytt søk forkaster forrige treff. Funnet barn legges til. |
| BA | Barnet har fått nytt fødselsnummer | Informasjon om det nyeste fødselsnummeret vises |
| BA | Åpne barnesøket | Søket åpnes i skjemaet, ikke i modal |

#### Farskapssak, nasjonal

`rollebilde/SaksrollerVisning.ct.spec.ts`

| Søk etter | Scenario | Forventet resultat |
|---|---|---|
| RM | Saken har to barn. Sett RM og trykk Lagre. | «En farskapssak kan bare gjelde ett barn.» Ingenting lagres. |

#### Ektefellebidragssak, nasjonal

`rollebilde/SaksrollerVisning.ct.spec.ts`

| Søk etter | Scenario | Forventet resultat |
|---|---|---|
| Ingen | Åpne saken | Barneseksjonen vises ikke, og saken kan ikke redigeres |

#### Foreldre, alle sakstyper med foreldre

`rollebilde/forelder/ForelderRolleVisning.ct.spec.ts`

Foreldrekortene virker likt for alle sakstyper, så testene bruker ingen bestemt sakstype.

| Søk etter | Scenario | Forventet resultat |
|---|---|---|
| Ingen | Både BP og BM er kjent | Begge vises side om side |
| Ingen | BM mangler | «Ukjent - ikke registrert» og «Legg til person» vises |
| BM | Trykk «Legg til person» | Søket åpnes i skjemaet, ikke i modal |
| BM | Søk opp og legg til BM | BM legges til |
| BM | Personen har fått nytt fødselsnummer | Kortet viser informasjon om det nyeste fødselsnummeret etter søket |
| BP | BP mangler. Legg til BP og angre. | BP kan legges til og fjernes igjen |

## Kjøre testene

Fra roten av repoet:

```bash
pnpm run test:ct apps/web/app/routes/sak/saksroller
```
