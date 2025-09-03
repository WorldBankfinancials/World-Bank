import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage-factory";
import { setupTransferRoutes } from './routes-transfer';
import { ObjectStorageService } from './objectStorage';


// Utility functions for generating account details
function generateAccountNumber(): string {
  return `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateAccountId(): string {
  return `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user by Supabase ID
  app.get('/api/users/supabase/:supabaseId', async (req, res) => {
    try {
      const { supabaseId } = req.params;
      const users = await storage.getAllUsers();
      const user = users.find(u => u.supabaseUserId === supabaseId);
      
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Get Supabase user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Create new Supabase-linked user with PENDING status
  app.post('/api/users/create-supabase', async (req, res) => {
    try {
      const { supabaseUserId, email, fullName } = req.body;
      
      // Create new user with PENDING status - requires admin approval
      const newUser = await storage.createUser({
        username: email,
        password: 'supabase_auth', // Password not used for Supabase users
        email,
        fullName: fullName || 'New Banking Customer',
        phone: 'Pending Admin Update',
        accountNumber: generateAccountNumber(),
        accountId: generateAccountId(),
        profession: 'Pending Admin Update',
        dateOfBirth: '1990-01-01',
        address: 'Pending Admin Update',
        city: 'Pending Admin Update',
        state: 'Pending Admin Update',
        country: 'Pending Admin Update',
        postalCode: '00000',
        annualIncome: 'Pending Admin Update',
        idType: 'Pending Admin Update',
        idNumber: 'Pending Admin Update',
        transferPin: '1234', // Default PIN - admin can change
        role: 'customer',
        isVerified: false, // REQUIRES ADMIN APPROVAL
        isOnline: false, // INACTIVE until approved
        isActive: false, // INACTIVE until approved
        supabaseUserId,
        balance: 0.00, // NO BALANCE until admin deposits
        adminNotes: 'New Supabase registration - requires full admin verification and setup'
      });

      // Create empty placeholder accounts - admin will fund these
      await storage.createAccount({
        userId: newUser.id,
        accountNumber: generateAccountNumber(),
        accountType: 'checking',
        accountName: 'Primary Checking (Pending Admin Setup)',
        balance: "0.00", // ZERO until admin deposits
        currency: 'USD'
      });

      await storage.createAccount({
        userId: newUser.id,
        accountNumber: generateAccountNumber(),
        accountType: 'savings',
        accountName: 'Savings Account (Pending Admin Setup)',
        balance: "0.00", // ZERO until admin deposits
        currency: 'USD'
      });

      // Create admin notification for new registration
      await storage.createAdminAction({
        adminId: 1, // System admin
        actionType: 'new_registration',
        targetType: 'user',
        targetId: newUser.id.toString(),
        description: `New Supabase user registration: ${email} - requires complete admin approval workflow`,
        metadata: JSON.stringify({
          email,
          fullName,
          supabaseUserId,
          registrationDate: new Date().toISOString(),
          requiresApproval: true,
          requiresVerification: true,
          requiresFunding: true,
          requiresPhotoUpload: true
        })
      });

      res.json(newUser);
    } catch (error) {
      console.error('Create Supabase user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Get pending Supabase registrations for admin approval
  app.get('/api/admin/pending-registrations', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const pendingUsers = users.filter(user => 
        user.supabaseUserId && 
        !user.isVerified && 
        !user.isActive
      );

      const pendingRegistrations = pendingUsers.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        supabaseUserId: user.supabaseUserId,
        registrationDate: user.createdAt?.toISOString() || new Date().toISOString(),
        phone: user.phone || 'Pending Admin Update',
        profession: user.profession || 'Pending Admin Update',
        accountNumber: user.accountNumber,
        accountId: user.accountId,
        status: 'pending',
        adminNotes: user.adminNotes || '',
        balance: user.balance || 0,
        requiresApproval: true,
        requiresVerification: true,
        requiresFunding: true,
        requiresPhotoUpload: true
      }));

      res.json(pendingRegistrations);
    } catch (error) {
      console.error('Get pending registrations error:', error);
      res.status(500).json({ error: 'Failed to fetch pending registrations' });
    }
  });

  // Approve Supabase registration
  app.post('/api/admin/approve-registration/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        approvalNotes, 
        initialDeposit, 
        phone, 
        profession, 
        address, 
        city, 
        state, 
        country,
        avatarUrl
      } = req.body;

      const userId = parseInt(id);
      
      // Update user with admin-approved information
      const updatedUser = await storage.updateUser(userId, {
        isVerified: true,
        isActive: true,
        isOnline: true,
        phone: phone || 'Admin Updated',
        profession: profession || 'Banking Customer',
        address: address || 'Admin Updated Address',
        city: city || 'Admin Updated City',
        state: state || 'Admin Updated State',
        country: country || 'Admin Updated Country',
        balance: parseFloat(initialDeposit) || 5000.00,
        avatarUrl: avatarUrl || null,
        adminNotes: approvalNotes || 'Approved by admin',
        modifiedByAdmin: "1"
      });

      if (updatedUser) {
        // Update user accounts with initial deposits
        const userAccounts = await storage.getUserAccounts(userId);
        
        for (const account of userAccounts) {
          const accountDeposit = parseFloat(initialDeposit) / userAccounts.length;
          
          // Create initial deposit transaction
          await storage.createTransaction({
            accountId: account.id,
            type: 'credit',
            amount: accountDeposit.toString(),
            description: 'Initial Account Funding - Admin Approved Registration',
            category: 'deposit',
            status: 'completed',
            adminNotes: `Admin approved registration with $${initialDeposit} initial deposit`,
            date: new Date()
          });
        }

        // Log admin action
        await storage.createAdminAction({
          adminId: 1,
          actionType: 'approve_registration',
          targetType: 'user',
          targetId: userId.toString(),
          description: `Approved Supabase registration for ${updatedUser.email} with $${initialDeposit} initial deposit`,
          metadata: JSON.stringify({
            approvalNotes,
            initialDeposit,
            approvedAt: new Date().toISOString()
          })
        });

        res.json({ success: true, user: updatedUser });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Approve registration error:', error);
      res.status(500).json({ error: 'Failed to approve registration' });
    }
  });

  // Reject Supabase registration
  app.post('/api/admin/reject-registration/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const userId = parseInt(id);
      
      // Update user with rejection status
      const updatedUser = await storage.updateUser(userId, {
        isVerified: false,
        isActive: false,
        adminNotes: `REJECTED: ${rejectionReason}`,
        modifiedByAdmin: "1"
      });

      if (updatedUser) {
        // Log admin action
        await storage.createAdminAction({
          adminId: 1,
          actionType: 'reject_registration',
          targetType: 'user',
          targetId: userId.toString(),
          description: `Rejected Supabase registration for ${updatedUser.email}: ${rejectionReason}`,
          metadata: JSON.stringify({
            rejectionReason,
            rejectedAt: new Date().toISOString()
          })
        });

        res.json({ success: true, user: updatedUser });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Reject registration error:', error);
      res.status(500).json({ error: 'Failed to reject registration' });
    }
  });

  // Special handler for Liu Wei account mapping
  app.get('/api/user', async (req, res) => {
    try {
      // Check session or headers for Supabase user info
      const supabaseEmail = req.headers['x-supabase-email'] as string;
      
      if (supabaseEmail === 'bankmanagerworld5@gmail.com') {
        // Return Liu Wei's account data for this specific Supabase user
        const liuWeiUser = await storage.getUserByUsername('liu.wei');
        if (liuWeiUser) {
          res.json(liuWeiUser);
          return;
        }
      }
      
      // Fall back to existing session-based user lookup
      const user = await storage.getUser(1); // Default user for now
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Registration endpoint (hybrid Supabase + backend)
  app.post('/api/register', async (req, res) => {
    try {
      const userData = req.body;
      
      // Generate unique account details
      const accountNumber = userData.accountNumber || generateAccountNumber();
      const accountId = userData.accountId || generateAccountId();
      
      const newUser = await storage.createUser({
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        accountNumber,
        accountId,
        profession: userData.profession,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        postalCode: userData.postalCode,
        annualIncome: userData.annualIncome,
        idType: userData.idType,
        idNumber: userData.idNumber,
        supabaseUserId: userData.supabaseUserId,
        role: 'customer',
        isVerified: false,
        isActive: false,
        balance: 0,
      });

      // Create admin action for new registration
      await storage.createAdminAction({
        adminId: 1, // System admin
        actionType: 'user_registration',
        targetId: newUser.id.toString(),
        targetType: 'user',
        description: `New user registration: ${userData.fullName} (${userData.email})`,
        metadata: JSON.stringify({
          registrationDate: new Date(),
          email: userData.email,
          profession: userData.profession,
          country: userData.country
        })
      });

      res.json({ 
        success: true, 
        message: 'Registration submitted for admin approval',
        userId: newUser.id 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  // Get current user (dynamic from storage system)
  app.get("/api/user", async (_req, res) => {
    try {
      // Get user data from dynamic storage system
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Ensure balance is calculated from accounts
      const userAccounts = await storage.getUserAccounts(1);
      const totalBalance = userAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
      
      const responseUser = {
        ...user,
        balance: totalBalance > 0 ? totalBalance : user.balance
      };
      
      console.log("API Response - Dynamic User data:", JSON.stringify(responseUser, null, 2));
      res.json(responseUser);
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user accounts
  app.get("/api/accounts", async (_req, res) => {
    try {
      // For demo purposes, always return accounts for user with ID 1
      const accounts = await storage.getUserAccounts(1);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get account transactions
  app.get("/api/accounts/:id/transactions", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ message: "Invalid account ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getAccountTransactions(accountId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get transactions for a specific user by user ID
  app.get("/api/accounts/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Get all accounts for the user
      const accounts = await storage.getUserAccounts(userId);
      const allTransactions = [];

      // Get transactions for each account
      for (const account of accounts) {
        const transactions = await storage.getAccountTransactions(account.id, limit);
        allTransactions.push(...transactions);
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      
      res.json(allTransactions.slice(0, limit));
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Get all recent transactions for user
  app.get("/api/transactions/recent", async (_req, res) => {
    try {
      // Get all accounts for user 1
      const accounts = await storage.getUserAccounts(1);
      const allTransactions = [];

      // Get transactions for each account
      for (const account of accounts) {
        const transactions = await storage.getAccountTransactions(account.id, 5);
        // Add account info to each transaction
        const transactionsWithAccount = transactions.map(t => ({
          ...t,
          accountName: account.accountName,
          accountType: account.accountType
        }));
        allTransactions.push(...transactionsWithAccount);
      }

      // Sort by date and return top 10
      allTransactions.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      res.json(allTransactions.slice(0, 10));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Admin Routes - Transfer Management
  app.get("/api/admin/pending-transfers", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingTransfers = await storage.getPendingTransactions();
      res.json(pendingTransfers);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/transfers/:id/approve", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transferId = parseInt(req.params.id);
      const { notes } = req.body;

      const updatedTransfer = await storage.updateTransactionStatus(transferId, 'approved', userId, notes);
      
      if (!updatedTransfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      res.json({ message: "Transfer approved successfully", transfer: updatedTransfer });
    } catch (error) {
      console.error("Error approving transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/transfers/:id/reject", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transferId = parseInt(req.params.id);
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ message: "Rejection reason required" });
      }

      const updatedTransfer = await storage.updateTransactionStatus(transferId, 'rejected', userId, notes);
      
      if (!updatedTransfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      res.json({ message: "Transfer rejected successfully", transfer: updatedTransfer });
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Routes - User Registration Management (removed auth for simple admin access)

  app.post("/api/admin/approve-registration/:id", async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const { notes, initialBalance } = req.body;

      // Approve the user registration
      const updatedUser = await storage.updateUser(registrationId, {
        isVerified: true,
        isActive: true,
        balance: initialBalance || 0,
        adminNotes: notes
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Create admin action for approval
      await storage.createAdminAction({
        adminId: 1,
        actionType: 'user_approved',
        targetId: registrationId.toString(),
        targetType: 'user',
        description: `User registration approved: ${updatedUser.fullName}`,
        metadata: JSON.stringify({
          approvalDate: new Date(),
          initialBalance: initialBalance || 0,
          adminNotes: notes
        })
      });

      res.json({ 
        message: "Registration approved successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/reject-registration/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const registrationId = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Rejection reason required" });
      }

      // Mark user as rejected
      const updatedUser = await storage.updateUser(registrationId, {
        isVerified: false,
        isActive: false,
        modifiedByAdmin: userId,
        adminNotes: `Registration rejected: ${reason}`
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Create admin action for rejection
      await storage.createAdminAction({
        adminId: 1,
        actionType: 'user_rejected',
        targetId: registrationId.toString(),
        targetType: 'user',
        description: `User registration rejected: ${updatedUser.fullName}`,
        metadata: JSON.stringify({
          rejectionDate: new Date(),
          reason: reason
        })
      });

      res.json({ 
        message: "Registration rejected successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Routes - Customer Support
  app.get("/api/admin/support-tickets", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/support-tickets/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const ticketId = parseInt(req.params.id);
      const updates = req.body;

      const updatedTicket = await storage.updateSupportTicket(ticketId, {
        ...updates,
        assignedTo: userId
      });
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      res.json({ message: "Support ticket updated successfully", ticket: updatedTicket });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced Transfer API with proper workflow
  app.post("/api/transfers", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const {
        transactionId,
        amount,
        currency,
        recipientName,
        recipientAccount,
        recipientCountry,
        bankName,
        swiftCode,
        transferType,
        purpose,
        status = 'pending_approval'
      } = req.body;

      // Validate required fields
      if (!amount || !recipientName || !recipientAccount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user accounts
      const accounts = await storage.getUserAccounts(userId);
      if (accounts.length === 0) {
        return res.status(400).json({ message: "No account found" });
      }

      const fromAccount = accounts[0];

      // Create transaction record for admin approval (all transfers require approval)
      const transaction = await storage.createTransaction({
        date: new Date(),
        accountId: fromAccount.id,
        type: transferType || "international_transfer",
        amount: amount.toString(),
        description: `Transfer to ${recipientName}`,
        recipientName: recipientName,
        recipientCountry: recipientCountry || "Unknown",
        bankName: bankName || "Unknown Bank",
        swiftCode: swiftCode || "",
        transferPurpose: purpose || "Personal",
        status: "pending_approval" // All transfers require admin approval
      });

      res.json({ 
        message: "Transfer submitted for approval", 
        transaction: transaction,
        transactionId: transactionId || `WB-${Date.now()}`
      });
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingTransfers = await storage.getPendingTransactions();
      const tickets = await storage.getSupportTickets();
      
      const stats = {
        totalCustomers: 1250,
        todayVolume: "2,847,392",
        pendingTransfers: pendingTransfers.length,
        openTickets: tickets.filter(t => t.status === 'open').length
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all customers (admin only)
  app.get("/api/admin/customers", async (req, res) => {
    try {
      const userId = req.session?.userId || 1; // Demo admin user
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      const customers = users.filter(user => user.role !== "admin").map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email || "liu.wei@oilrig.com",
        phone: user.phone || "+1-555-0123",
        address: user.address || "123 Marine Drive",
        city: user.city || "Houston",
        state: user.state || "Texas",
        country: user.country || "United States",
        postalCode: user.postalCode || "77001",
        profession: user.profession || "Marine Engineer",
        annualIncome: user.annualIncome || "100k_250k",
        idType: user.idType || "passport",
        idNumber: user.idNumber || "US123456789",
        isVerified: user.isVerified || false,
        isOnline: user.isOnline || false,
        accountNumber: "4789-6523-1087-9234",
        accountId: "WB-2024-7829",
        balance: 125000,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString()
      }));

      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Get all customers (admin only)
  app.get("/api/admin/customers", async (req: any, res) => {
    try {
      const userId = req.session?.userId || 1; // Demo admin user
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      const customers = allUsers.filter(user => user.role !== "admin");

      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Update customer information (admin only)
  app.patch("/api/admin/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const userId = 2; // Demo admin user - bypass session for development
      console.log("Admin update request received for customer", customerId);
      const updates = req.body;

      console.log(`Updating customer ${customerId} with:`, JSON.stringify(updates, null, 2));

      const updatedUser = await storage.updateUser(customerId, {
        ...updates,
        updatedAt: new Date()
      });

      console.log(`Update result:`, updatedUser ? 'Success' : 'Failed');

      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: "customer_update",
        targetType: "user",
        targetId: customerId.toString(),
        description: `Updated customer information for ${updatedUser.fullName}`,
        metadata: JSON.stringify(updates)
      });

      res.json({ message: "Customer updated successfully", customer: updatedUser });
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Verify customer (admin only)
  app.post("/api/admin/customers/:id/verify", async (req, res) => {
    try {
      const userId = req.session?.userId || 1; // Demo admin user
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const customerId = parseInt(req.params.id);
      
      const updatedUser = await storage.updateUser(customerId, {
        isVerified: true,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: "customer_verify",
        targetType: "user",
        targetId: customerId.toString(),
        description: `Verified customer ${updatedUser.fullName}`,
        metadata: null
      });

      res.json({ message: "Customer verified successfully", customer: updatedUser });
    } catch (error) {
      console.error("Verify customer error:", error);
      res.status(500).json({ error: "Failed to verify customer" });
    }
  });

  // Update customer balance (admin only)
  app.post("/api/admin/customers/:id/balance", async (req, res) => {
    try {
      const userId = req.session?.userId || 2; // Demo admin user
      const adminUser = await storage.getUser(userId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const customerId = parseInt(req.params.id);
      const { amount } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const updatedUser = await storage.updateUserBalance(customerId, Number(amount));

      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: "balance_update",
        targetType: "user",
        targetId: customerId.toString(),
        description: `Updated balance by $${amount} for ${updatedUser.fullName}`,
        metadata: JSON.stringify({ amount, newBalance: updatedUser.balance })
      });

      res.json({ message: "Balance updated successfully", customer: updatedUser });
    } catch (error) {
      console.error("Update balance error:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Profile picture upload endpoint (deprecated - now handled by PATCH /api/admin/customers/:id)
  app.post('/api/admin/customers/:id/profile-picture', async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const userId = 2; // Demo admin user

      // In a real implementation, you would handle file upload here
      // For now, we'll simulate storing the profile picture URL
      const profilePicUrl = `/uploads/profile-${customerId}-${Date.now()}.jpg`;

      const updatedUser = await storage.updateUser(customerId, {
        avatarUrl: profilePicUrl,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: "profile_picture_update",
        targetType: "user",
        targetId: customerId.toString(),
        description: `Updated profile picture for ${updatedUser.fullName}`,
        metadata: JSON.stringify({ profilePicUrl })
      });

      res.json({ message: "Profile picture updated successfully", avatarUrl: profilePicUrl });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

  // Customer query response endpoint
  app.post('/api/admin/tickets/:id/respond', async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { response } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updatedTicket = await storage.updateSupportTicket(ticketId, {
        status: 'resolved',
        adminNotes: response,
        assignedTo: userId,
        resolvedAt: new Date(),
        updatedAt: new Date()
      });

      if (!updatedTicket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: "ticket_response",
        targetType: "support_ticket",
        targetId: ticketId.toString(),
        description: `Responded to support ticket #${ticketId}`,
        metadata: JSON.stringify({ response })
      });

      res.json({ message: "Response sent successfully", ticket: updatedTicket });
    } catch (error) {
      console.error("Ticket response error:", error);
      res.status(500).json({ error: "Failed to send response" });
    }
  });

  // Customer verification endpoint
  app.post('/api/admin/customers/:id/verify', async (req: any, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { verified } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updatedUser = await storage.updateUser(customerId, {
        isVerified: verified,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Log admin action
      await storage.createAdminAction({
        adminId: userId,
        actionType: verified ? "customer_verify" : "customer_unverify",
        targetType: "user",
        targetId: customerId.toString(),
        description: `${verified ? 'Verified' : 'Unverified'} customer ${updatedUser.fullName}`,
        metadata: null
      });

      res.json({ 
        message: `Customer ${verified ? 'verified' : 'unverified'} successfully`, 
        customer: updatedUser 
      });
    } catch (error) {
      console.error("Customer verification error:", error);
      res.status(500).json({ error: "Failed to update customer verification" });
    }
  });

  // Admin statistics endpoint
  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const allUsers = await storage.getAllUsers();
      const allTransactions = await storage.getPendingTransactions();
      const allTickets = await storage.getSupportTickets();

      const stats = {
        totalCustomers: allUsers.length,
        pendingTransfers: allTransactions.length,
        openTickets: allTickets.filter(t => t.status === 'open').length,
        todayVolume: allTransactions
          .filter(t => {
            const today = new Date();
            const transactionDate = new Date(t.createdAt || new Date());
            return transactionDate.toDateString() === today.toDateString();
          })
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      };

      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin statistics" });
    }
  });

  // Admin balance top-up endpoint
  app.post("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const updatedUser = await storage.updateUserBalance(userId, amount);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Admin user profile update endpoint
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin customer profile update endpoint (alternative route)
  app.patch("/api/admin/customers/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Fund management endpoints
  app.post('/api/admin/create-transaction', async (req, res) => {
    try {
      const { customerId, type, amount, description, category, reference, status } = req.body as any;
      
      // Get customer's accounts to find the correct accountId
      const customerIdNum = Number(customerId);
      const accounts = await storage.getUserAccounts(customerIdNum);
      
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'No accounts found for customer' });
      }
      
      const accountId = accounts[0].id; // Use first account
      
      const transaction = await storage.createTransaction({
        accountId: accountId,
        type: type,
        amount: amount.toString(),
        description: description,
        category: category || null,
        status: status || 'completed',
        date: new Date(),
        bankName: null,
        swiftCode: null,
        recipientName: null,
        recipientCountry: null,
        transferPurpose: null,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        adminNotes: reference || null
      });

      res.json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  app.post('/api/admin/update-balance', async (req, res) => {
    try {
      const { customerId, amount, description } = req.body;
      
      // Parse customerId and amount as numbers
      const customerIdNum = parseInt(customerId);
      const amountNum = parseFloat(amount);
      
      if (isNaN(customerIdNum) || isNaN(amountNum)) {
        return res.status(400).json({ error: 'Invalid customer ID or amount' });
      }
      
      const user = await storage.updateUserBalance(customerIdNum, amountNum);
      
      if (user) {
        console.log(`✅ Admin Balance Update: Customer ${customerIdNum} balance changed by ${amountNum > 0 ? '+' : ''}${amountNum}, new balance: ${user.balance}`);
        
        // Get customer's accounts to find the correct accountId
        const accounts = await storage.getUserAccounts(customerIdNum);
        const accountId = accounts.length > 0 ? accounts[0].id : customerIdNum;
        
        // Create transaction record for audit trail
        await storage.createTransaction({
          accountId: accountId,
          type: amountNum > 0 ? 'credit' : 'debit',
          amount: Math.abs(amountNum).toString(),
          description: description || `Admin ${amountNum > 0 ? 'credit' : 'debit'} adjustment`,
          category: 'Admin Adjustment',
          status: 'completed',
          date: new Date(),
          adminNotes: `Balance adjustment by admin: ${amountNum}`,
          bankName: null,
          swiftCode: null,
          recipientName: null,
          recipientCountry: null,
          transferPurpose: null,
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null
        });
        
        res.json({ success: true, newBalance: user.balance });
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      res.status(500).json({ error: 'Failed to update balance' });
    }
  });

  app.get('/api/admin/transactions', async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      
      // Format transactions with customer info
      const formattedTransactions = allTransactions.map(transaction => ({
        id: transaction.id.toString(),
        type: transaction.type === 'credit' ? 'credit' : 'debit',
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        category: transaction.category || 'General',
        reference: transaction.adminNotes || `TXN-${transaction.id}`,
        status: transaction.status || 'completed',
        createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
        customerName: 'Mr. Liu Wei', // Default for now
        customerId: transaction.accountId
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Admin customer management endpoints
  app.patch('/api/admin/customers/:id', async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID' });
      }
      
      const updatedUser = await storage.updateUser(customerId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      console.log(`✅ Admin Profile Update: Customer ${customerId} profile updated`);
      
      // Log admin action for audit trail
      await storage.createAdminAction({
        adminId: 1, // Admin user ID
        actionType: 'profile_update',
        targetType: 'user',
        targetId: customerId.toString(),
        description: `Updated customer profile`,
        metadata: JSON.stringify(updateData)
      });
      
      res.json({ 
        success: true, 
        message: 'Customer profile updated successfully',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({ error: 'Failed to update customer profile' });
    }
  });

  app.post('/api/admin/customers/:id/balance', async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (isNaN(customerId) || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid customer ID or amount' });
      }
      
      const user = await storage.updateUserBalance(customerId, amount);
      
      if (!user) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      console.log(`✅ Admin Balance Top-up: Customer ${customerId} balance increased by ${amount}, new balance: ${user.balance}`);
      
      // Create transaction record for audit trail
      await storage.createTransaction({
        accountId: customerId,
        type: 'credit',
        amount: amount.toString(),
        description: `Admin balance top-up: +$${amount}`,
        category: 'Admin Top-up',
        status: 'completed',
        date: new Date(),
        adminNotes: `Balance top-up by admin: +${amount}`,
        bankName: null,
        swiftCode: null,
        recipientName: null,
        recipientCountry: null,
        transferPurpose: null,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null
      });
      
      // Log admin action
      await storage.createAdminAction({
        adminId: 1,
        actionType: 'balance_top_up',
        targetType: 'user',
        targetId: customerId.toString(),
        description: `Added $${amount} to customer balance`,
        metadata: JSON.stringify({ amount, newBalance: user.balance })
      });
      
      res.json({ 
        success: true, 
        newBalance: user.balance,
        message: `Successfully added $${amount} to customer balance`
      });
    } catch (error) {
      console.error('Error updating customer balance:', error);
      res.status(500).json({ error: 'Failed to update customer balance' });
    }
  });

  // User Registration Approval API endpoints
  app.post('/api/admin/approve-registration/:id', async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const { initialBalance, notes } = req.body;

      // Get the pending registration user
      const user = await storage.getUser(registrationId);
      if (!user) {
        return res.status(404).json({ message: 'Registration not found' });
      }

      if (user.isActive) {
        return res.status(400).json({ message: 'User is already activated' });
      }

      // Activate the user account
      const updatedUser = await storage.updateUser(registrationId, {
        isActive: true,
        isVerified: true,
        balance: initialBalance.toString()
      });

      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to approve registration' });
      }

      // Create initial checking account for the user
      await storage.createAccount({
        userId: registrationId,
        accountNumber: generateAccountNumber(),
        accountType: 'checking',
        accountName: 'Primary Checking',
        balance: initialBalance.toString(),
        currency: 'USD',
        isActive: true
      });

      // Log admin action
      await storage.createAdminAction({
        adminId: 1, // Current admin user ID
        actionType: 'registration_approval',
        targetType: 'user',
        targetId: registrationId.toString(),
        description: `Approved user registration for ${updatedUser.fullName} with initial balance $${initialBalance}`,
        metadata: JSON.stringify({ initialBalance, notes })
      });

      res.json({ 
        message: 'Registration approved successfully',
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/reject-registration/:id', async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const { reason } = req.body;

      // Get the pending registration user
      const user = await storage.getUser(registrationId);
      if (!user) {
        return res.status(404).json({ message: 'Registration not found' });
      }

      if (user.isActive) {
        return res.status(400).json({ message: 'User is already activated' });
      }

      // Mark user as rejected (could delete or keep for audit)
      const updatedUser = await storage.updateUser(registrationId, {
        isActive: false,
        adminNotes: `Registration rejected: ${reason}`
      });

      // Log admin action
      await storage.createAdminAction({
        adminId: 1, // Current admin user ID
        actionType: 'registration_rejection',
        targetType: 'user',
        targetId: registrationId.toString(),
        description: `Rejected user registration for ${user.fullName}`,
        metadata: JSON.stringify({ reason })
      });

      res.json({ 
        message: 'Registration rejected successfully',
        reason 
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get pending registrations for admin dashboard (simplified access)
  app.get('/api/admin/pending-registrations', async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const pendingRegistrations = allUsers.filter(user => 
        !user.isActive && user.role === 'customer'
      );

      res.json(pendingRegistrations);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Fund account endpoint for direct account number operations
  app.post('/api/admin/fund-account', async (req, res) => {
    try {
      const { accountNumber, type, amount, description, reference } = req.body;

      if (!accountNumber || !type || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Find user by account number
      const users = await storage.getAllUsers();
      const user = users.find(u => u.accountNumber === accountNumber);

      if (!user) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Get user's first account
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'No accounts found for user' });
      }

      const account = accounts[0];

      // Create transaction
      const transaction = await storage.createTransaction({
        accountId: account.id,
        amount: amount.toString(),
        type: type === 'credit' ? 'deposit' : 'withdrawal',
        description: description,
        status: 'completed',
        date: new Date(),
        category: 'admin_operation'
      });

      // Update user balance
      const balanceChange = type === 'credit' ? amount : -amount;
      await storage.updateUserBalance(user.id, balanceChange);

      // Log admin action
      await storage.createAdminAction({
        adminId: 1, // Admin user ID
        actionType: 'fund_operation',
        targetType: 'account',
        targetId: accountNumber,
        description: `${type === 'credit' ? 'Added' : 'Deducted'} $${amount} ${type === 'credit' ? 'to' : 'from'} account ${accountNumber}`,
        metadata: JSON.stringify({ amount, type, description, reference })
      });

      res.json({ 
        success: true, 
        message: `Successfully ${type === 'credit' ? 'added' : 'deducted'} $${amount} ${type === 'credit' ? 'to' : 'from'} account ${accountNumber}`,
        transaction 
      });
    } catch (error) {
      console.error('Error processing fund operation:', error);
      res.status(500).json({ error: 'Failed to process fund operation' });
    }
  });

  // Change user PIN endpoint
  app.post('/api/user/change-pin', async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;
      
      if (!currentPin || !newPin) {
        return res.status(400).json({ message: 'Current PIN and new PIN are required' });
      }

      // PIN validation
      if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        return res.status(400).json({ message: 'PIN must be 4 digits' });
      }

      // Get current user (simplified for demo - in production use proper session management)
      const users = await storage.getAllUsers();
      const user = users.find(u => u.role === 'customer' && u.isActive);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current PIN
      if (user.transferPin !== currentPin) {
        return res.status(400).json({ message: 'Current PIN is incorrect' });
      }

      // Update PIN
      const updatedUser = await storage.updateUser(user.id, {
        transferPin: newPin
      });

      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update PIN' });
      }

      // Log admin action for security audit
      await storage.createAdminAction({
        adminId: user.id,
        actionType: 'pin_change',
        targetType: 'user',
        targetId: user.id.toString(),
        description: `User changed transfer PIN`,
        metadata: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'] 
        })
      });

      res.json({ 
        success: true, 
        message: 'PIN changed successfully' 
      });
    } catch (error) {
      console.error('Error changing PIN:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for live chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Map<string, { ws: WebSocket; userId: string; role: 'admin' | 'customer' }>();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    let clientId: string | null = null;
    let clientRole: 'admin' | 'customer' = 'customer';

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          // Client authentication
          clientId = message.userId || `client_${Date.now()}`;
          clientRole = message.role || 'customer';
          if (clientId) {
            clients.set(clientId, { ws, userId: clientId, role: clientRole });
          }
          
          ws.send(JSON.stringify({
            type: 'auth_success',
            clientId,
            role: clientRole
          }));
          
          console.log(`Client authenticated: ${clientId} as ${clientRole}`);
        } else if (message.type === 'chat_message') {
          // Broadcast message to all connected clients
          const chatMessage = {
            type: 'chat_message',
            id: message.id,
            senderId: message.senderId,
            senderName: message.senderName,
            senderRole: message.senderRole,
            message: message.message,
            timestamp: message.timestamp,
            isRead: false
          };

          // Send to all connected clients except sender
          clients.forEach((client, id) => {
            if (id !== clientId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify(chatMessage));
            }
          });

          console.log(`Chat message from ${message.senderName}: ${message.message}`);
        } else if (message.type === 'typing') {
          // Broadcast typing indicator
          clients.forEach((client, id) => {
            if (id !== clientId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'typing',
                senderId: message.senderId,
                isTyping: message.isTyping
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (clientId) {
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (clientId) {
        clients.delete(clientId);
      }
    });

    // Send initial auth request
    ws.send(JSON.stringify({
      type: 'auth_request',
      message: 'Please authenticate'
    }));
  });

  console.log('WebSocket server initialized on /ws path');

  // Setup transfer routes
  // Object Storage Routes for ID Card Uploads
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Upload URL generation error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  setupTransferRoutes(app);

  return httpServer;
}
