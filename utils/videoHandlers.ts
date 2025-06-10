// videoHandlers.ts
import { VideoClip, GifSettings } from './gifMakerUtils';

export const handleVideoFileChange = (
  index: number,
  file: File | null,
  videoUrls: (string | null)[],
  gifSettings: GifSettings,
  setVideoClips: React.Dispatch<React.SetStateAction<VideoClip[]>>,
  setActiveVideoIndex: React.Dispatch<React.SetStateAction<number | null>>,
  objectUrlsRef: React.MutableRefObject<string[]>
) => {
  if (!file) return;

  // Clean up previous video URL if exists
  if (videoUrls[index]) {
    URL.revokeObjectURL(videoUrls[index]!);
  }

  const objectUrl = URL.createObjectURL(file);
  objectUrlsRef.current.push(objectUrl);

  const tempVideo = document.createElement("video");
  tempVideo.src = objectUrl;

  tempVideo.addEventListener("loadedmetadata", () => {
    const videoDuration = tempVideo.duration;

    setVideoClips((prev) => {
      const newClips = [...prev];
      // Preserve existing start/end times if switching files on the same index
      const existingClip = newClips[index];
      const hasExistingTimes =
        existingClip &&
        existingClip.file &&
        existingClip.startTime !== 0 &&
        existingClip.endTime !== existingClip.duration;

      newClips[index] = {
        file: file,
        startTime: hasExistingTimes
          ? Math.min(existingClip.startTime, videoDuration)
          : 0,
        endTime: hasExistingTimes
          ? Math.min(existingClip.endTime, videoDuration)
          : Math.min(gifSettings.maxDuration, videoDuration),
        duration: videoDuration,
        positionX: existingClip?.positionX || 0,
        positionY: existingClip?.positionY || 0,
        scale: existingClip?.scale || 1,
      };
      return newClips;
    });

    tempVideo.remove();
    setActiveVideoIndex(index);
  });

  tempVideo.addEventListener("error", () => {
    console.error("Failed to load video metadata");
    tempVideo.remove();
    URL.revokeObjectURL(objectUrl);
    objectUrlsRef.current = objectUrlsRef.current.filter(
      (url) => url !== objectUrl
    );
  });
};

export const handleStartTimeChange = (
  time: number,
  activeVideoIndex: number | null,
  videoClips: VideoClip[],
  gifSettings: GifSettings,
  setVideoClips: React.Dispatch<React.SetStateAction<VideoClip[]>>
) => {
  setVideoClips((prev) => {
    const newClips = [...prev];
    if (activeVideoIndex !== null && newClips[activeVideoIndex]) {
      const clip = newClips[activeVideoIndex];

      // Clamp the new start time to valid bounds
      let newStartTime = Math.max(0, Math.min(time, clip.duration - 0.1));
      let newEndTime = clip.endTime;

      // Calculate current duration
      const currentDuration = clip.endTime - clip.startTime;

      // If we have a duration close to max, maintain it as a sliding window
      if (currentDuration >= gifSettings.maxDuration - 0.1) {
        // Maintain the max duration by moving end time with start time
        newEndTime = newStartTime + gifSettings.maxDuration;

        // If end time would exceed video duration, adjust both
        if (newEndTime > clip.duration) {
          newEndTime = clip.duration;
          newStartTime = Math.max(0, newEndTime - gifSettings.maxDuration);
        }
      } else {
        // Duration is less than max, just ensure we don't exceed max
        if (newEndTime - newStartTime > gifSettings.maxDuration) {
          newEndTime = newStartTime + gifSettings.maxDuration;
        }
      }

      // Final validation
      newStartTime = Math.max(
        0,
        Math.min(newStartTime, clip.duration - 0.1)
      );
      newEndTime = Math.max(
        newStartTime + 0.1,
        Math.min(newEndTime, clip.duration)
      );

      newClips[activeVideoIndex] = {
        ...clip,
        startTime: newStartTime,
        endTime: newEndTime,
      };
    }
    return newClips;
  });
};

export const handleEndTimeChange = (
  time: number,
  activeVideoIndex: number | null,
  videoClips: VideoClip[],
  gifSettings: GifSettings,
  setVideoClips: React.Dispatch<React.SetStateAction<VideoClip[]>>
) => {
  setVideoClips((prev) => {
    const newClips = [...prev];
    if (activeVideoIndex !== null && newClips[activeVideoIndex]) {
      const clip = newClips[activeVideoIndex];

      // Clamp the new end time to valid bounds
      let newEndTime = Math.max(0.1, Math.min(time, clip.duration));
      let newStartTime = clip.startTime;

      // Calculate current duration
      const currentDuration = clip.endTime - clip.startTime;

      // If we have a duration close to max, maintain it as a sliding window
      if (currentDuration >= gifSettings.maxDuration - 0.1) {
        // Maintain the max duration by moving start time with end time
        newStartTime = newEndTime - gifSettings.maxDuration;

        // If start time would go below 0, adjust both
        if (newStartTime < 0) {
          newStartTime = 0;
          newEndTime = Math.min(gifSettings.maxDuration, clip.duration);
        }
      } else {
        // Duration is less than max, just ensure we don't exceed max
        if (newEndTime - newStartTime > gifSettings.maxDuration) {
          newStartTime = newEndTime - gifSettings.maxDuration;
          if (newStartTime < 0) {
            newStartTime = 0;
            newEndTime = Math.min(gifSettings.maxDuration, clip.duration);
          }
        }
      }

      // Ensure minimum clip duration (0.1 seconds)
      if (newEndTime - newStartTime < 0.1) {
        if (newEndTime < clip.duration) {
          newEndTime = newStartTime + 0.1;
        } else {
          newStartTime = newEndTime - 0.1;
        }
      }

      // Final validation
      newStartTime = Math.max(0, newStartTime);
      newEndTime = Math.min(
        clip.duration,
        Math.max(newStartTime + 0.1, newEndTime)
      );

      newClips[activeVideoIndex] = {
        ...clip,
        startTime: newStartTime,
        endTime: newEndTime,
      };
    }
    return newClips;
  });
};