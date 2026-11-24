/**
 * Global Media Track & Blob URL Teardown Registry
 * Ensures complete session cleanup on Sign Out (camera/mic streams & blob URLs).
 */

const activeStreams = new Set<MediaStream>();
const activeBlobUrls = new Set<string>();

export function registerMediaStream(stream: MediaStream): void {
  activeStreams.add(stream);
}

export function unregisterMediaStream(stream: MediaStream): void {
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore individual track errors
      }
    });
  } catch {
    // ignore
  }
  activeStreams.delete(stream);
}

export function registerBlobUrl(url: string): string {
  if (url && url.startsWith('blob:')) {
    activeBlobUrls.add(url);
  }
  return url;
}

export function revokeRegisteredBlobUrl(url: string | null | undefined): void {
  if (!url) return;
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  } catch {
    // ignore
  }
  activeBlobUrls.delete(url);
}

/**
 * Stops all active camera/microphone media tracks (registered or attached to video/audio elements)
 * and revokes all registered blob: URLs.
 */
export function teardownAllMediaAndBlobs(): void {
  // 1. Stop explicitly registered MediaStreams
  activeStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  });
  activeStreams.clear();

  // 2. Stop any MediaStream still attached to DOM video/audio elements
  if (typeof document !== 'undefined') {
    try {
      document.querySelectorAll('video, audio').forEach((el) => {
        const mediaEl = el as HTMLMediaElement;
        const srcObj = mediaEl.srcObject;
        if (srcObj && typeof (srcObj as MediaStream).getTracks === 'function') {
          (srcObj as MediaStream).getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {
              // ignore
            }
          });
          mediaEl.srcObject = null;
        }
      });
    } catch {
      // ignore
    }
  }

  // 3. Revoke all registered blob: URLs
  activeBlobUrls.forEach((blobUrl) => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {
      // ignore
    }
  });
  activeBlobUrls.clear();
}
