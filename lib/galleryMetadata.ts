const GalleryMetadataKeys = {
  revenue: "Revenue",
  revenueUpdatedAt: "RevenueUpdatedAt",
  rotationStatus: "RotationStatus",
  rotationUpdatedAt: "RotationUpdatedAt",
  rotationDaysSince: "RotationDaysSince",
  rotationReady: "RotationReady",
  rotationDateSent: "RotationDateSent",
} as const;

type GalleryMetadataKey = (typeof GalleryMetadataKeys)[keyof typeof GalleryMetadataKeys];

export type GalleryMetadataMap = Partial<Record<GalleryMetadataKey, string>>;

const metadataLookup: Record<string, GalleryMetadataKey> = Object.values(
  GalleryMetadataKeys
).reduce((acc, key) => {
  acc[key.toLowerCase()] = key;
  return acc;
}, {} as Record<string, GalleryMetadataKey>);

const metadataOrder: GalleryMetadataKey[] = [
  GalleryMetadataKeys.revenue,
  GalleryMetadataKeys.revenueUpdatedAt,
  GalleryMetadataKeys.rotationStatus,
  GalleryMetadataKeys.rotationUpdatedAt,
  GalleryMetadataKeys.rotationDaysSince,
  GalleryMetadataKeys.rotationReady,
  GalleryMetadataKeys.rotationDateSent,
];

export const parseGalleryMetadata = (notes: string = ""): GalleryMetadataMap => {
  const metadata: GalleryMetadataMap = {};
  if (!notes) return metadata;

  const lines = notes.split("\n");
  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const canonicalKey = metadataLookup[key];
    if (!canonicalKey) continue;
    metadata[canonicalKey] = match[2].trim();
  }

  return metadata;
};

export const stripGalleryMetadata = (notes: string = ""): string => {
  if (!notes) return "";
  const lines = notes.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("[")) return true;
    const closingIndex = trimmed.indexOf("]");
    if (closingIndex === -1) return true;
    const key = trimmed.slice(1, closingIndex).trim().toLowerCase();
    return !metadataLookup[key];
  });
  return filtered.join("\n").trim();
};

export const serializeGalleryNotes = (
  metadata: GalleryMetadataMap,
  baseNotes: string = ""
): string => {
  const lines: string[] = [];

  metadataOrder.forEach((key) => {
    const value = metadata[key];
    if (value === undefined || value === null) return;
    const trimmed = typeof value === "string" ? value.trim() : String(value);
    if (!trimmed) return;
    lines.push(`[${key}] ${trimmed}`);
  });

  if (baseNotes.trim()) {
    lines.push(baseNotes.trim());
  }

  return lines.join("\n").trim();
};

export const setGalleryMetadataValue = (
  metadata: GalleryMetadataMap,
  key: GalleryMetadataKey,
  value?: string | number | boolean | null
) => {
  if (value === undefined || value === null || value === "") {
    delete metadata[key];
    return;
  }
  metadata[key] = typeof value === "string" ? value : String(value);
};

export { GalleryMetadataKeys };
