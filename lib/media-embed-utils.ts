export const URL_PATTERNS = {
  // Comprehensive URL matching pattern
  url: /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*))/g,
  
  // Specific platform patterns
  youtube: [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ],
  
  github: [
    /github\.com\/([^\/\s]+)\/([^\/\s]+)(?:\/[^\s]*)?/,
    /gist\.github\.com\/([^\/\s]+)\/([a-zA-Z0-9]+)/,
  ],
  
  twitter: [
    /(?:twitter\.com|x\.com)\/([^\/\s]+)\/status\/(\d+)/,
  ],
  
  codepen: [
    /codepen\.io\/([^\/\s]+)\/pen\/([a-zA-Z0-9]+)/,
  ],
  
  image: [
    /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i,
  ],
  
  video: [
    /\.(mp4|webm|ogg|mov)(\?[^\s]*)?$/i,
  ],
};

export interface DetectedMedia {
  url: string;
  type: 'youtube' | 'github' | 'twitter' | 'codepen' | 'image' | 'video' | 'generic';
  startIndex: number;
  endIndex: number;
  id?: string;
}

/**
 * Extract all embeddable URLs from text content
 */
export function extractMediaUrls(content: string): DetectedMedia[] {
  const urls: DetectedMedia[] = [];
  const urlMatches = Array.from(content.matchAll(URL_PATTERNS.url));
  
  for (const match of urlMatches) {
    const url = match[0];
    const type = getMediaType(url);
    const id = extractMediaId(url, type);
    
    urls.push({
      url,
      type,
      startIndex: match.index!,
      endIndex: match.index! + url.length,
      id,
    });
  }
  
  return urls;
}

/**
 * Determine the media type of a URL
 */
export function getMediaType(url: string): DetectedMedia['type'] {
  // Check YouTube
  if (URL_PATTERNS.youtube.some(pattern => pattern.test(url))) {
    return 'youtube';
  }
  
  // Check GitHub
  if (URL_PATTERNS.github.some(pattern => pattern.test(url))) {
    return 'github';
  }
  
  // Check Twitter/X
  if (URL_PATTERNS.twitter.some(pattern => pattern.test(url))) {
    return 'twitter';
  }
  
  // Check CodePen
  if (URL_PATTERNS.codepen.some(pattern => pattern.test(url))) {
    return 'codepen';
  }
  
  // Check images
  if (URL_PATTERNS.image.some(pattern => pattern.test(url))) {
    return 'image';
  }
  
  // Check videos
  if (URL_PATTERNS.video.some(pattern => pattern.test(url))) {
    return 'video';
  }
  
  return 'generic';
}

/**
 * Extract relevant ID from media URL
 */
export function extractMediaId(url: string, type: DetectedMedia['type']): string | undefined {
  switch (type) {
    case 'youtube':
      for (const pattern of URL_PATTERNS.youtube) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      break;
      
    case 'github':
      const repoMatch = url.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/);
      if (repoMatch) return `${repoMatch[1]}/${repoMatch[2]}`;
      
      const gistMatch = url.match(/gist\.github\.com\/([^\/\s]+)\/([a-zA-Z0-9]+)/);
      if (gistMatch) return `gist:${gistMatch[1]}/${gistMatch[2]}`;
      break;
      
    case 'twitter':
      const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\s]+)\/status\/(\d+)/);
      if (twitterMatch) return twitterMatch[2];
      break;
      
    case 'codepen':
      const codepenMatch = url.match(/codepen\.io\/([^\/\s]+)\/pen\/([a-zA-Z0-9]+)/);
      if (codepenMatch) return `${codepenMatch[1]}/${codepenMatch[2]}`;
      break;
  }
  
  return undefined;
}

/**
 * Check if a URL is embeddable (not just a generic link)
 */
export function isEmbeddable(url: string): boolean {
  const type = getMediaType(url);
  return type !== 'generic';
}

/**
 * Generate embed HTML for supported platforms
 */
export function generateEmbedHtml(url: string, type: DetectedMedia['type'], id?: string): string {
  switch (type) {
    case 'youtube':
      if (!id) return '';
      return `
        <div class="media-embed youtube-embed">
          <iframe 
            src="https://www.youtube.com/embed/${id}"
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="w-full aspect-video rounded-lg"
          ></iframe>
        </div>
      `;
      
    case 'github':
      if (!id) return '';
      if (id.startsWith('gist:')) {
        const gistId = id.replace('gist:', '').split('/')[1];
        return `
          <div class="media-embed github-embed">
            <script src="https://gist.github.com/${id.replace('gist:', '')}.js"></script>
          </div>
        `;
      }
      return `
        <div class="media-embed github-embed">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="block p-4 border rounded-lg hover:bg-gray-50">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span class="font-medium">${id}</span>
            </div>
          </a>
        </div>
      `;
      
    case 'image':
      return `
        <div class="media-embed image-embed">
          <img 
            src="${url}" 
            alt="Embedded image"
            class="max-w-full h-auto rounded-lg"
            loading="lazy"
          />
        </div>
      `;
      
    case 'video':
      return `
        <div class="media-embed video-embed">
          <video 
            src="${url}" 
            controls 
            class="w-full max-h-96 rounded-lg"
            preload="metadata"
          >
            <a href="${url}">Download video</a>
          </video>
        </div>
      `;
      
    default:
      return '';
  }
}

/**
 * Replace URLs in markdown content with embed placeholders
 */
export function processContentForEmbeds(content: string): {
  processedContent: string;
  embeds: DetectedMedia[];
} {
  const embeds = extractMediaUrls(content);
  let processedContent = content;
  
  // Process embeds from end to start to maintain correct indices
  const sortedEmbeds = [...embeds].sort((a, b) => b.startIndex - a.startIndex);
  
  for (const embed of sortedEmbeds) {
    if (isEmbeddable(embed.url)) {
      // Replace URL with a placeholder that we can process on the frontend
      const placeholder = `\n\n[MEDIA_EMBED:${embed.type}:${embed.url}]\n\n`;
      processedContent = 
        processedContent.slice(0, embed.startIndex) + 
        placeholder + 
        processedContent.slice(embed.endIndex);
    }
  }
  
  return {
    processedContent,
    embeds: embeds.filter(embed => isEmbeddable(embed.url)),
  };
}

/**
 * Extract embed placeholders from processed content
 */
export function extractEmbedPlaceholders(content: string): Array<{
  type: DetectedMedia['type'];
  url: string;
  placeholder: string;
}> {
  const placeholderPattern = /\[MEDIA_EMBED:(\w+):([^\]]+)\]/g;
  const placeholders: Array<{
    type: DetectedMedia['type'];
    url: string;
    placeholder: string;
  }> = [];
  
  let match;
  while ((match = placeholderPattern.exec(content)) !== null) {
    placeholders.push({
      type: match[1] as DetectedMedia['type'],
      url: match[2],
      placeholder: match[0],
    });
  }
  
  return placeholders;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Check if URL is a direct media file
 */
export function isDirectMedia(url: string): boolean {
  return URL_PATTERNS.image.some(pattern => pattern.test(url)) ||
         URL_PATTERNS.video.some(pattern => pattern.test(url));
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension ? extension.toLowerCase() : null;
  } catch {
    return null;
  }
}