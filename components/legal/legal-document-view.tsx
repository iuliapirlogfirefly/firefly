import { Link } from "@/i18n/navigation";
import type {
  LegalBlock,
  LegalDocument,
  LegalInlinePart,
} from "@/lib/legal/content/types";

function InlineParts({ parts }: { parts: LegalInlinePart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (!("href" in part) || !part.href) {
          return <span key={index}>{part.text}</span>;
        }
        if (part.external) {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-firefly/90 underline underline-offset-2 transition-colors hover:text-firefly"
            >
              {part.text}
            </a>
          );
        }
        return (
          <Link
            key={index}
            // Legal pages only; href is a known app path from content modules.
            href={part.href as "/cookies"}
            className="text-firefly/90 underline underline-offset-2 transition-colors hover:text-firefly"
          >
            {part.text}
          </Link>
        );
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="font-medium text-foreground">{block.text}</h3>
      );
    case "p":
      return <p>{block.text}</p>;
    case "rich":
      return (
        <p>
          <InlineParts parts={block.parts} />
        </p>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-5">
          {block.items.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <p className="border-l-2 border-firefly/40 pl-4 text-foreground/70">
          {block.text}
        </p>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-firefly/15">
                {block.headers.map((header) => (
                  <th
                    key={header}
                    className="px-2 py-2 font-mono text-[10px] uppercase tracking-wider-2 text-foreground/45"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b border-firefly/10 align-top"
                >
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell.slice(0, 24)}`} className="px-2 py-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

type Props = {
  document: LegalDocument;
  lastUpdatedLabel: string;
  backHome: string;
  metaLabels: {
    operator: string;
    contact: string;
  };
};

export function LegalDocumentView({
  document,
  lastUpdatedLabel,
  backHome,
  metaLabels,
}: Props) {
  return (
    <main className="min-h-screen bg-background px-6 pb-16 pt-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {document.title}
        </h1>
        <p className="mt-2 text-sm text-foreground/45">
          {lastUpdatedLabel}: {document.lastUpdated}
        </p>
        {(document.operator || document.contact) && (
          <dl className="mt-4 space-y-1 text-sm text-foreground/55">
            {document.operator ? (
              <div>
                <dt className="inline text-foreground/40">
                  {metaLabels.operator}:{" "}
                </dt>
                <dd className="inline">{document.operator}</dd>
              </div>
            ) : null}
            {document.contact ? (
              <div>
                <dt className="inline text-foreground/40">
                  {metaLabels.contact}:{" "}
                </dt>
                <dd className="inline">
                  <a
                    href={`mailto:${document.contact}`}
                    className="transition-colors hover:text-firefly"
                  >
                    {document.contact}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        )}
        <div className="prose-legal mt-10 space-y-6 text-base leading-relaxed text-foreground/75">
          {document.blocks.map((block, index) => (
            <Block key={`${block.type}-${index}`} block={block} />
          ))}
        </div>
        <p className="mt-12">
          <Link
            href="/"
            className="text-sm text-foreground/50 transition-colors hover:text-firefly"
          >
            ← {backHome}
          </Link>
        </p>
      </article>
    </main>
  );
}
