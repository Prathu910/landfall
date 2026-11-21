/**
 * The rough, uneven-ink edge shared by every stamp. Each stamp passes its own
 * useId so two stamps on one page never share or shadow an id.
 */
export function InkFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.85"
        numOctaves={2}
        seed={4}
        result="noise"
      />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.6} />
      <feComponentTransfer>
        <feFuncA type="discrete" tableValues="0 1 1 1 0.8 1" />
      </feComponentTransfer>
    </filter>
  );
}
