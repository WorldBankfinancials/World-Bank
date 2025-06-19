import { storage } from './storage-factory';
import { InsertUser } from '../shared/schema';

function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `4789-6523-${timestamp.slice(0, 4)}-${random}`;
}

function generateAccountId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WB-2024-${timestamp}${random}`;
}

export async function createNewUserWithUniqueData(userData: Partial<InsertUser> = {}): Promise<any> {
  const userId = Date.now();
  
  // Create new user with unique data - NO automatic accounts
  const newUser = await storage.createUser({
    username: userData.username || `user_${userId}`,
    password: userData.password || "password123",
    fullName: userData.fullName || `New Customer ${userId}`,
    email: userData.email || `user${userId}@example.com`,
    phone: userData.phone || `+1-555-${String(userId).slice(-4)}`,
    accountNumber: generateAccountNumber(),
    accountId: generateAccountId(),
    profession: userData.profession || "Professional",
    dateOfBirth: userData.dateOfBirth || "1990-01-01",
    address: userData.address || "123 Main Street",
    city: userData.city || "New York",
    state: userData.state || "NY",
    country: userData.country || "United States",
    postalCode: userData.postalCode || "10001",
    annualIncome: userData.annualIncome || "$75,000",
    idType: userData.idType || "Driver License",
    idNumber: userData.idNumber || `DL${userId}`,
    transferPin: userData.transferPin || "1234",
    role: userData.role || "customer",
    balance: userData.balance || 0.00,
    isVerified: false,
    isOnline: false,
    isActive: false,
    ...userData
  });

  console.log(`✅ New user created: ${newUser.fullName} (ID: ${newUser.id}) - Admin must manually create accounts`);
  
  return newUser;
}