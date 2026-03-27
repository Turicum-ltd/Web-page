import { withConfiguredBasePath } from "@/lib/turicum/runtime";

const FULL_WORDMARK_SRC = withConfiguredBasePath("/brand/turicum-wordmark.svg");
const COMPACT_WORDMARK_SRC = withConfiguredBasePath("/brand/turicum-wordmark-compact.svg");

export function TuricumWordmark({
  compact = false,
  showDescriptor = true
}: {
  compact?: boolean;
  showDescriptor?: boolean;
}) {
  const src = compact || !showDescriptor ? COMPACT_WORDMARK_SRC : FULL_WORDMARK_SRC;
  const alt = showDescriptor ? "Turicum LLC Lending Operations" : "Turicum LLC";

  return (
    <span className={`turicum-wordmark${compact ? " turicum-wordmark-compact" : ""}`}>
      <img src={src} alt={alt} />
    </span>
  );
}
