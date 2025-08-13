import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export type ExportGifOptions = {
  fps?: number; // default 60
  width?: number; // default 480, keep aspect automatically
  startSeconds?: number; // optional trim start
  durationSeconds?: number; // optional duration
  maxColors?: number; // default 64 (smaller size vs full 256)
  dither?: "none" | "bayer" | "floyd_steinberg" | "heckbert"; // default "bayer"
  bayerScale?: number; // default 5 (only used when dither = "bayer")
};

export async function exportVideoBlobToGif(
  videoBlob: Blob,
  opts: ExportGifOptions = {}
): Promise<Blob> {
  const fps = opts.fps ?? 60;
  const width = opts.width ?? 480;
  const start = opts.startSeconds ?? 0;
  const duration = opts.durationSeconds ?? undefined;
  const maxColors = opts.maxColors ?? 64;
  const dither = opts.dither ?? "bayer";
  const bayerScale = opts.bayerScale ?? 5;

  const ffmpeg = createFFmpeg({ log: false });
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const inputName = "input.mp4";
  const paletteName = "palette.png";
  const outputName = "output.gif";

  await ffmpeg.FS("writeFile", inputName, await fetchFile(videoBlob));

  // Force RGB without alpha to avoid GIF transparency artifacts (e.g., blurred areas turning black)
  const vfBase = `fps=${fps},scale=${width}:-1:flags=lanczos,format=rgb24`;

  const commonTrim: string[] = [];
  if (start && start > 0) {
    commonTrim.push("-ss", String(start));
  }
  if (duration && duration > 0) {
    commonTrim.push("-t", String(duration));
  }

  // Generate palette for better quality (no transparent reservation to avoid artifacts)
  await ffmpeg.run(
    ...[
      "-i",
      inputName,
      ...commonTrim,
      "-vf",
      `${vfBase},palettegen=stats_mode=diff:max_colors=${maxColors}:reserve_transparent=0`,
      "-y",
      paletteName,
    ]
  );

  // Apply palette to create final GIF (disable alpha via rgb24 and alpha_threshold=0)
  await ffmpeg.run(
    ...[
      "-i",
      inputName,
      ...commonTrim,
      "-i",
      paletteName,
      "-lavfi",
      `${vfBase} [x]; [x][1:v] paletteuse=dither=${dither}${dither === "bayer" ? `:bayer_scale=${bayerScale}` : ""}:diff_mode=rectangle:alpha_threshold=0`,
      "-y",
      outputName,
    ]
  );

  const data = ffmpeg.FS("readFile", outputName) as Uint8Array;
  const out = new Uint8Array(data);
  return new Blob([out], { type: "image/gif" });
}
