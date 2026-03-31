interface TuricumWordmarkProps {
  compact?: boolean;
  showDescriptor?: boolean;
  assetBasePath?: string;
}

export function TuricumWordmark({
  compact = false,
  showDescriptor = true,
  assetBasePath = ""
}: TuricumWordmarkProps) {
  const normalizedBase = assetBasePath.endsWith("/") ? assetBasePath.slice(0, -1) : assetBasePath;
  const src = `${normalizedBase}/brand/${compact || !showDescriptor ? "turicum-wordmark-compact.svg" : "turicum-wordmark.svg"}`;
  const alt = showDescriptor ? "Turicum LLC Lending Operations" : "Turicum LLC";

  return (
    <span className={`turicum-wordmark${compact ? " turicum-wordmark-compact" : ""}`}>
      <img src={src} alt={alt} />
    </span>
  );
}
