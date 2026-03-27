export function TuricumMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`turicum-mark${compact ? " turicum-mark-compact" : ""}`} aria-hidden="true">
      <span className="turicum-mark-frame">
        <span className="turicum-mark-t">T</span>
        <span className="turicum-mark-l">L</span>
      </span>
    </span>
  );
}
