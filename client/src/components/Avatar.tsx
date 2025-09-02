import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

export function Avatar({ size = 48 }: { size?: number }) {
  const [profileImageData, setProfileImageData] = useState<string>("");
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await signOut();
    setLocation('/login');
  };

  useEffect(() => {
    // Fetch the latest profile image from API
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.avatarUrl && data.avatarUrl.startsWith('data:image/')) {
          setProfileImageData(data.avatarUrl);
        }
      })
      .catch(() => {
        // Use default image if fetch fails
        setProfileImageData("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoGRCEKhscEUUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/fyiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/2Q==");
      });
  }, []);

  return (
    <div className="flex items-center space-x-2">
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-gray-600 hover:text-red-600"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}