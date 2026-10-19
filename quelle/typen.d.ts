// Typen für Bibliotheken, die zur Laufzeit geladen werden (nur für die TypeScript-Prüfung, nicht Teil der App).
interface Window {
  /** jsPDF, selbst gehostet unter vendor/ */
  jspdf: any;
  /** Texterkennung, wird nur bei Bedarf nachgeladen */
  Tesseract: any;
  /** Supabase-Bibliothek, selbst gehostet unter vendor/ */
  supabase: any;
}

// Die App greift über document.querySelector(...) auf Knöpfe und Eingabefelder zu.
// Diese Erweiterung erlaubt das ohne Umwandlung an jeder Stelle.
interface Element {
  click(): void;
  focus(options?: FocusOptions): void;
  blur(): void;
  select(): void;
  value: string;
  disabled: boolean;
  hidden: boolean;
  readonly offsetWidth: number;
}
interface ParentNode {
  closest(selectors: string): Element | null;
}
