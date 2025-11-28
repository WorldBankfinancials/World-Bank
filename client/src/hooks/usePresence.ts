export function usePresence() { return null; }
export function useOnlineUsers(callback?: (users: any) => void) { 
  if (callback) callback([]);
  return null; 
}
