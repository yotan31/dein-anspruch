// Aktionen „Personen und Familie“: Person wechseln oder anlegen, Familie einladen, Person löschen.
// Jeder Eintrag gehört zu einem Knopf mit data-act="…"; aufgerufen von ui/bedienung.js mit dem angetippten Element t.
import { addPerson, deletePerson, loadMembers, makeInvite } from "../../services/speicher.js";
import { Z } from "../../state/zustand.js";
import { copy } from "../hinweise.js";
import { render, scrollTop } from "../render.js";

/** @type {Record<string, (t: HTMLElement, name: string) => void>} */
export const AKTIONEN_PERSONEN = {
  persons: (t) => {
    Z.showPersons = !Z.showPersons;
    Z.delPersonAsk = false;
    if (Z.showPersons) loadMembers();
    render();
    scrollTop();
  },
  "add-person": (t) => {
    addPerson();
  },
  invite: (t) => {
    makeInvite();
  },
  "inv-copy": (t) => {
    copy(Z.inviteLink);
  },
  "del-person": (t) => {
    Z.delPersonAsk = true;
    render();
  },
  "del-person-no": (t) => {
    Z.delPersonAsk = false;
    render();
  },
  "del-person-yes": (t) => {
    deletePerson();
  },
};
