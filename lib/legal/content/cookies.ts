import type { LegalDocument } from "./types";

const ro: LegalDocument = {
  title: "POLITICA DE UTILIZARE COOKIE-URI",
  lastUpdated: "August 2026",
  operator: "FIREFLY CONCEPT SRL",
  contact: "contact@fireflyapp.ro",
  blocks: [
  { type: "p", text: "Site-ul fireflyapp.ro folosește cookie-uri pentru a funcționa corect și pentru a vă oferi o experiență de navigare sigură și fluidă." },
  { type: "h2", text: "1. Ce sunt cookie-urile?" },
  { type: "p", text: "Cookie-urile sunt mici fișiere text salvate în browserul tău pentru a permite funcționarea corectă a unui site web. Cookie-urile nu conțin programe software, viruși sau spyware și nu pot accesa informațiile stocate pe dispozitivul utilizatorului." },
  { type: "h2", text: "2. Ce cookie-uri folosim?" },
  { type: "p", text: "Platforma fireflyapp.ro folosește exclusiv cookie-uri strict necesare. Acestea sunt utilizate doar pentru:" },
  { type: "ul", items: [
    "Menținerea sesiunii de autentificare (să rămâi logat în contul de utilizator sau business).",
    "Protecția și securitatea contului tău.",
  ] },
  { type: "p", text: "Nu folosim cookie-uri de analiză a traficului (analytics), reclame sau urmărire (tracking)." },
  { type: "table", headers: ["Cookie", "Scop", "Durată", "Tip"], rows: [
    ["sb-*-auth-token (și variante fragmentate .0, .1, …)", "Menținerea sesiunii de autentificare", "Sesiune / durata stabilită de furnizorul de autentificare", "Strict necesar"],
    ["ff_cookie_consent", "Reținerea confirmării privind informarea despre cookie-uri", "1 an", "Strict necesar"],
  ] },
  { type: "h2", text: "3. Acordul tău" },
  { type: "p", text: "Cookie-urile strict necesare sunt utilizate fără consimțământul prealabil al utilizatorului, deoarece sunt necesare pentru furnizarea serviciului solicitat și pentru funcționarea și securitatea platformei. Te informăm în mod transparent cu privire la utilizarea acestora." },
  { type: "h2", text: "4. Cum le poți modifica?" },
  { type: "p", text: "Poți șterge sau bloca cookie-urile direct din setările browserului tău (Chrome, Safari, Firefox).  Blocarea lor va împiedica autentificarea pe site." },
  { type: "h2", text: "5. Modificări" },
  { type: "p", text: "Rezervăm dreptul de a modifica această politică odată cu adăugarea de noi cookie-uri. Versiunea activă este cea indicată de data ultimei actualizări." },
  ],
};

const en: LegalDocument = {
  title: "COOKIE POLICY",
  lastUpdated: "August 2026",
  operator: "FIREFLY CONCEPT SRL",
  contact: "contact@fireflyapp.ro",
  blocks: [
  { type: "p", text: "The website fireflyapp.ro uses cookies to function properly and to provide you with a safe and smooth browsing experience." },
  { type: "h2", text: "1. What Are Cookies?" },
  { type: "p", text: "Cookies are small text files stored in your browser to enable the proper functioning of a website. Cookies do not contain software programs, viruses, or spyware and cannot access information stored on the user's device." },
  { type: "h2", text: "2. What Cookies Do We Use?" },
  { type: "p", text: "The fireflyapp.ro platform uses strictly necessary cookies only. These are used solely for:" },
  { type: "ul", items: [
    "Maintaining your authentication session (keeping you logged in to your user or business account).",
    "Ensuring the protection and security of your account.",
  ] },
  { type: "p", text: "We do not use analytics, advertising, or tracking cookies." },
  { type: "table", headers: ["Cookie", "Purpose", "Duration", "Type"], rows: [
    ["sb-*-auth-token (and chunked variants .0, .1, …)", "Maintaining the authentication session", "Session / duration set by the authentication provider", "Strictly necessary"],
    ["ff_cookie_consent", "Remembering that you acknowledged the cookie notice", "1 year", "Strictly necessary"],
  ] },
  { type: "h2", text: "3. Your Consent" },
  { type: "p", text: "Strictly necessary cookies are used without the user's prior consent because they are necessary to provide the requested service and to ensure the functionality and security of the platform. We provide transparent information about their use." },
  { type: "h2", text: "4. How Can You Manage Cookies?" },
  { type: "p", text: "You can delete or block cookies directly through your browser settings (Chrome, Safari, Firefox). Blocking these cookies will prevent you from logging in to the website." },
  { type: "h2", text: "5. Changes to This Policy" },
  { type: "p", text: "We reserve the right to update this policy if we introduce new cookies. The active version is indicated by the \"Last updated\" date." },
  ],
};

export const cookiesContent: Record<"en" | "ro", LegalDocument> = { en, ro };
