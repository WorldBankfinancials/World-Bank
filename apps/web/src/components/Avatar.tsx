import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/lib/queryClient';

// Default avatar base64 image (extracted to a constant)
const DEFAULT_AVATAR_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoGRCEKhscEUUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/fyiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/2Q==";

// Module-level cache so multiple Avatar instances don't re-fetch
let avatarCache: string | null = null;

export function Avatar({ size = 48 }: { size?: number }) {
  const [profileImageData, setProfileImageData] = useState<string>(avatarCache ?? "");

  useEffect(() => {
    // If we already have a cached avatar, use it
    if (avatarCache) {
      setProfileImageData(avatarCache);
      return;
    }

    const controller = new AbortController();

    authenticatedFetch('/api/user')
      .then(async res => {
        if (!res.ok) {
          return null;
        }
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then(data => {
        if (controller.signal.aborted) return;
        if (data && data.avatarUrl && data.avatarUrl.startsWith('data:image/')) {
          avatarCache = data.avatarUrl;
          setProfileImageData(data.avatarUrl);
        } else {
          avatarCache = DEFAULT_AVATAR_BASE64;
          setProfileImageData(DEFAULT_AVATAR_BASE64);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        avatarCache = DEFAULT_AVATAR_BASE64;
        setProfileImageData(DEFAULT_AVATAR_BASE64);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: `${size}px`,
      height: `${size}px`
    }}>
      <img
        src={profileImageData}
        alt="Profile"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #dbeafe'
        }}
      />
    </div>
  );
}
