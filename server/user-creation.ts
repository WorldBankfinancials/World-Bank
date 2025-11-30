import { storage } from './storage-factory';
import { InsertUser } from '../shared/schema';

function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.getRandomValues(new Uint8Array(4))[0] // secure random * 10000).toString().padStart(4, '0');
  return `4789-6523-${timestamp.slice(0, 4)}-${random}`;
}

function generateAccountId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = crypto.getRandomValues(new Uint8Array(4))[0] // secure random * 10000).toString().padStart(4, '0');
  return `WB-2024-${timestamp}${random}`;
}

export async function createNewUserWithUniqueData(userData: Partial<InsertUser> = {}): Promise<any> {
  const userId = Date.now();
  
  // Create new user with unique data - NO automatic accounts
  const newUser = await storage.createUser({
    username: userData.username || `user_${userId}`,
    password: userData.password || "supabase_auth",
    firstName: userData.firstName || "New",
    lastName: userData.lastName || `Customer${userId}`,
    email: userData.email || `user${userId}@example.com`,
    phone: userData.phone || `+1-555-${String(userId).slice(-4)}`,
    accountNumber: generateAccountNumber(),
    accountId: userId,
    profession: userData.profession || "Professional",
    balance: userData.balance || "0.00",
    ...userData
  });

  
  return newUser;
}