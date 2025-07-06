// Configuration for video download fallbacks
export const VIDEO_DOWNLOAD_CONFIG = {
  // Maximum file size for direct download (in bytes) - 100MB
  MAX_DIRECT_SIZE: 100 * 1024 * 1024,
  
  // Timeout for each download attempt (in milliseconds)
  DOWNLOAD_TIMEOUT: 30000,
  
  // Maximum number of retry attempts
  MAX_RETRIES: 3,
  
  // Whether to attempt direct download if proxy fails
  ALLOW_DIRECT_FALLBACK: true,
  
  // Whether to stream large files in chunks
  USE_STREAMING: true,
  
  // Chunk size for streaming (in bytes) - 1MB
  CHUNK_SIZE: 1024 * 1024,
};

export const getUserAgent = () => {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
};

export const getVideoHeaders = () => {
  return {
    'User-Agent': getUserAgent(),
    'Accept': 'video/mp4,video/*,*/*',
    'Accept-Encoding': 'identity',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'video',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
  };
};
