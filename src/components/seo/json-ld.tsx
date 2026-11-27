import { serializeJsonLd } from "@/lib/seo/json-ld";

/** A page's structured data, one script per node (built in src/lib/seo/json-ld.ts). */
export function JsonLd({ data }: { data: object[] }) {
  return (
    <>
      {data.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
    </>
  );
}
