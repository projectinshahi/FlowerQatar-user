type JsonLdObject = Record<string, unknown>;

/**
 * Renders a JSON-LD <script> for structured data. Server-safe.
 * `<` is escaped so a value like "</script>" cannot break out of the script tag (XSS).
 */
export default function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
