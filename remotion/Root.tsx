import { Composition, registerRoot } from "remotion";
import VideoComposition from "../components/gif-maker-3/player/VideoComposition";

export const RemotionRoot: React.FC = () => {
  // Default empty composition; runtime props come from renderer inputProps
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          clips: [] as Clip[],
          textOverlays: [] as TextOverlay[],
          blurOverlays: [] as BlurOverlay[],
          clipEffects: {},
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
