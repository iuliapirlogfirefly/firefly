export type LegalInlinePart =
  | { text: string; href?: undefined; external?: undefined }
  | { text: string; href: string; external?: boolean };

export type LegalBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "rich"; parts: LegalInlinePart[] }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  operator?: string | null;
  contact?: string | null;
  blocks: LegalBlock[];
};
