"use client";
import { Accordion } from "@mantine/core";
export function Faq({ items }: { items: [string, string][] }) {
  return (
    <Accordion variant="default">
      {items.map(([q, a]) => (
        <Accordion.Item key={q} value={q}>
          <Accordion.Control>{q}</Accordion.Control>
          <Accordion.Panel>{a}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
