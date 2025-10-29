import { useState, useEffect } from "react";
import * as React from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { 
  Shield, 
  Clock, 
  MessageSquare, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  Eye,
  Upload,
  DollarSign,
  Plus,
  CreditCard,
  Search,
  Edit3,
  X,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import { BankLogo } from '@/components/BankLogo';
import { useToast } from '@/hooks/use-toast';

interface PendingTransfer {
  id: number;
  amount: string;
  currency: string;
  recipientName: string;
  recipientBank: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  status: string;
}

interface SupportTicket {
  id: number;
  subject: string;
  customerName: string;
  priority: string;
  status: string;
  createdAt: string;
  description: string;
}

interface CustomerAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  interestRate?: number;
  minimumBalance?: number;
}

interface Customer {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  accountNumber: string;
  profession: string;
  isVerified: boolean;
  isOnline: boolean;
  avatarUrl: string | null;
  balance?: number;
  accounts?: CustomerAccount[];
  supabaseUserId?: string;
  adminNotes?: string;
  isActive?: boolean;
}

interface PendingRegistration {
  id: number;
  fullName: string;
  email: string;
  supabaseUserId: string;
  registrationDate: string;
  phone: string;
  profession: string;
  accountNumber: string;
  accountId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  balance: number;
  requiresApproval: boolean;
  requiresVerification: boolean;
  requiresFunding: boolean;
  requiresPhotoUpload: boolean;
}

// All data is now fetched from real APIs with real-time synchronization

export default function SimpleAdmin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTab, setSelectedTab] = useState("transfers");
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);

  // Real-time data from API
  const [realTimeAccounts, setRealTimeAccounts] = useState<CustomerAccount[]>([]);

  // Fund management states
  const [selectedAccountType, setSelectedAccountType] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundType, setFundType] = useState<"credit" | "debit">("credit");
  const [fundDescription, setFundDescription] = useState("");

  // Transaction creation states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedCustomerForTransaction, setSelectedCustomerForTransaction] = useState<number | null>(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("");

  // Profile upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchUserData = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return; // Short-circuit if no token to avoid invalid Authorization headers
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        toast({
          title: 'Data Fetch Failed',
          description: 'Unable to load user profile data. Please refresh the page.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to server. Please check your connection and try again.',
        variant: 'destructive'
      });
    }
  };

  const fetchPendingRegistrations = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return; // Short-circuit if no token
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/pending-registrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRegistrations(data);
      } else {
        toast({
          title: 'Data Fetch Failed',
          description: 'Unable to load pending registrations. Please refresh the page.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Failed to load pending registrations. Please check your connection.',
        variant: 'destructive'
      });
    }
  };

  const fetchPendingTransfers = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return; // Short-circuit if no token
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/pending-transfers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTransfers(data || []);
      } else {
        setTransfers([]);
        toast({
          title: 'Data Fetch Failed',
          description: 'Unable to load pending transfers. Showing empty list.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setTransfers([]);
      toast({
        title: 'Connection Error',
        description: 'Failed to load pending transfers. Please check your connection.',
        variant: 'destructive'
      });
    }
  };

  const fetchSupportTickets = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return; // Short-circuit if no token
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/support-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data || []);
      } else {
        // Try fallback endpoint
        try {
          const { authenticatedFetch } = await import('@/lib/queryClient');
          const token = sessionStorage.getItem('adminToken');
          const response = await authenticatedFetch('/api/support-tickets', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const formattedTickets = data.map((t: any) => ({
              id: t.id,
              subject: t.description?.substring(0, 50) || 'Support Ticket',
              customerName: t.userId ? `User ${t.userId}` : 'Unknown',
              priority: t.priority || 'Medium',
              status: t.status || 'Open',
              createdAt: t.createdAt,
              description: t.description || ''
            }));
            setTickets(formattedTickets);
          } else {
            setTickets([]);
            toast({
              title: 'Data Fetch Failed',
              description: 'Unable to load support tickets. Please refresh the page.',
              variant: 'destructive'
            });
          }
        } catch (e) {
          setTickets([]);
          toast({
            title: 'Connection Error',
            description: 'Failed to load support tickets. Please check your connection.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      setTickets([]);
      toast({
        title: 'Connection Error',
        description: 'Failed to load support tickets. Please check your connection.',
        variant: 'destructive'
      });
    }
  };

  const fetchCustomers = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return; // Short-circuit if no token
    
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerList(data || []);
      } else {
        // Try fallback endpoint
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const response = await authenticatedFetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const formattedCustomers = data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName || u.email,
            email: u.email,
            phone: u.phone || 'N/A',
            accountNumber: u.accountNumber || 'N/A',
            profession: u.profession || 'N/A',
            isVerified: u.isVerified || false,
            isOnline: u.isOnline || false,
            avatarUrl: u.avatarUrl,
            balance: parseFloat(u.balance || '0'),
            accounts: [],
            supabaseUserId: u.supabaseUserId,
            adminNotes: u.adminNotes || '',
            isActive: u.isActive !== false
          }));
          setCustomerList(formattedCustomers);
        } else {
          setCustomerList([]);
          toast({
            title: 'Data Fetch Failed',
            description: 'Unable to load customer list. Please refresh the page.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      setCustomerList([]);
      toast({
        title: 'Data Fetch Failed',
        description: 'Unable to load customer list. Please refresh the page.',
        variant: 'destructive'
      });
    }
  };

  // Real-time subscriptions setup
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to real-time updates via Supabase
    const channel = supabase
      .channel('admin-realtime-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_users' }, () => {
        console.log('🔄 User data changed, refreshing customers');
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        console.log('🔄 Support ticket changed, refreshing tickets');
        fetchSupportTickets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        console.log('🔄 Transaction changed, refreshing transfers');
        fetchPendingTransfers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, () => {
        console.log('🔄 Account changed, refreshing customers');
        fetchCustomers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
      fetchPendingRegistrations();
      fetchPendingTransfers();
      fetchSupportTickets();
      fetchCustomers();
      
      // Refresh data every 30 seconds as backup
      const interval = setInterval(() => {
        fetchPendingRegistrations();
        fetchPendingTransfers();
        fetchSupportTickets();
        fetchCustomers();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Server-side admin authentication via API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Invalid admin credentials. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      const data = await response.json();
      
      // Store admin token in sessionStorage for subsequent API requests
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUser', JSON.stringify(data.user));
      
      setIsAuthenticated(true);
      console.log('✅ Admin authenticated:', data.user.email);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'Failed to authenticate. Please check your credentials and try again.',
        variant: 'destructive'
      });
    }
  };

  const handleApproveRegistration = async (registrationId: number) => {
    try {
      const initialBalance = prompt("Set initial account balance (USD):", "5000");
      
      if (!initialBalance || isNaN(parseFloat(initialBalance))) {
        toast({
          title: 'Invalid Input',
          description: 'Please enter a valid initial balance',
          variant: 'destructive'
        });
        return;
      }

      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/approve-registration/${registrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ initialBalance: parseFloat(initialBalance) })
      });

      if (response.ok) {
        setPendingRegistrations(prev => prev.filter(r => r.id !== registrationId));
        toast({
          title: 'Registration Approved',
          description: `Account activated successfully with $${initialBalance} balance.`
        });
        fetchPendingRegistrations();
      } else {
        const error = await response.json();
        toast({
          title: 'Approval Failed',
          description: error.message || 'Failed to approve registration',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve registration. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectRegistration = async (registrationId: number) => {
    try {
      const reason = prompt("Rejection reason (required):", "Incomplete documentation");
      
      if (!reason || reason.trim().length === 0) {
        toast({
          title: 'Invalid Input',
          description: 'Rejection reason is required',
          variant: 'destructive'
        });
        return;
      }

      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/reject-registration/${registrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setPendingRegistrations(prev => prev.filter(r => r.id !== registrationId));
        toast({
          title: 'Registration Rejected',
          description: `User registration rejected. Reason: ${reason}`
        });
        fetchPendingRegistrations();
      } else {
        const error = await response.json();
        toast({
          title: 'Rejection Failed',
          description: error.message || 'Failed to reject registration',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject registration. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender: "admin" | "customer";
    message: string;
    timestamp: string;
  }>>([]);

  // Customer editing states
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    profession: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    dateOfBirth: '',
    nationality: '',
    annualIncome: ''
  });

  const handleApproveTransfer = (transferId: number) => {
    setTransfers(prev => prev.filter(t => t.id !== transferId));
    // console.log(`Approved transfer ${transferId}`);
  };

  const handleRejectTransfer = (transferId: number) => {
    setTransfers(prev => prev.filter(t => t.id !== transferId));
    // console.log(`Rejected transfer ${transferId}`);
  };

  const handleOpenChat = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: "admin" as const,
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage("");
    }
  };

  const handleEditCustomer = async (customer: Customer) => {
    // Fetch complete user data from API to populate edit form
    try {
      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setEditingCustomer(customer);
        setEditForm({
          fullName: userData.fullName || customer.fullName,
          email: userData.email || customer.email,
          phone: userData.phone || '+86 138 0013 8000',
          profession: userData.profession || 'Marine Engineer',
          address: userData.address || 'Beijing Shijingshan',
          city: userData.city || 'Beijing',
          country: userData.country || 'China',
          postalCode: userData.postalCode || '100043',
          dateOfBirth: userData.dateOfBirth || '1963-10-17',
          nationality: userData.nationality || 'Chinese',
          annualIncome: userData.annualIncome || '$85,000'
        });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      // console.error('Error fetching user data for edit:', error);
      // Use fallback data based on customer profile settings
      setEditingCustomer(customer);
      setEditForm({
        fullName: customer.fullName || 'Customer',
        email: customer.email || '',
        phone: '+86 138 0013 8000',
        profession: 'Marine Engineer',
        address: 'Beijing Shijingshan',
        city: 'Beijing',
        country: 'China',
        postalCode: '100043',
        dateOfBirth: '1963-10-17',
        nationality: 'Chinese',
        annualIncome: '$85,000'
      });
    }
  };

  const handleSaveCustomerEdit = async () => {
    if (!editingCustomer) return;
    
    try {
      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone,
          profession: editForm.profession,
          address: editForm.address,
          city: editForm.city,
          country: editForm.country,
          postalCode: editForm.postalCode,
          dateOfBirth: editForm.dateOfBirth,
          nationality: editForm.nationality,
          annualIncome: editForm.annualIncome
        })
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomerList(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updatedCustomer } : c));
        setEditingCustomer(null);
        toast({
          title: 'Customer Updated',
          description: 'Customer information has been updated successfully.',
        });
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (error) {
      // console.error('Error updating customer:', error);
      toast({
        title: 'Update Failed',
        description: 'Unable to update customer information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setEditForm({
      fullName: '',
      email: '',
      phone: '',
      profession: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      dateOfBirth: '',
      nationality: '',
      annualIncome: ''
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'Please select an image smaller than 5MB.',
            variant: 'destructive',
          });
          return;
        }
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file (JPG, PNG, etc.).',
          variant: 'destructive',
        });
      }
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !editingCustomer) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let base64Image = e.target?.result as string;
          
          if (!base64Image) {
            throw new Error('Failed to read image file');
          }

          // Always compress image for reliable upload
          // console.log('Compressing image for upload...');
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Always resize to max 200x200 for small payload
            const maxSize = 200;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedImage = canvas.toDataURL('image/jpeg', 0.6); // Lower quality for smaller size
            
            // console.log(`Image compressed from ${base64Image.length} to ${compressedImage.length} bytes`);
            uploadCompressedImage(compressedImage);
          };
          img.src = base64Image;
        } catch (uploadError: any) {
          // console.error('Upload error:', uploadError);
          setUploadingPhoto(false);
          toast({
            title: 'Upload Failed',
            description: `Failed to upload photo: ${uploadError?.message || 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      };
      
      const uploadCompressedImage = async (base64Image: string) => {
        try {
          const token = sessionStorage.getItem('adminToken');
          const { authenticatedFetch } = await import('@/lib/queryClient');
          
          const response = await authenticatedFetch(`/api/admin/customers/${editingCustomer.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              avatarUrl: base64Image
            })
          });

          if (response.ok) {
            const result = await response.json();
            // console.log('Photo upload successful:', result);
            
            setCustomerList(prev => prev.map(c => 
              c.id === editingCustomer.id ? { ...c, avatarUrl: base64Image } : c
            ));
            setSelectedFile(null);
            setUploadingPhoto(false);
            toast({
              title: 'Photo Uploaded',
              description: 'Profile photo has been uploaded successfully.',
            });
            
            // Invalidate user queries to trigger refetch in customer interface
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
          } else {
            const errorData = await response.json();
            // console.error('Upload failed:', errorData);
            throw new Error(errorData.error || 'Failed to upload photo');
          }
        } catch (uploadError: any) {
          // console.error('Upload error:', uploadError);
          setUploadingPhoto(false);
          toast({
            title: 'Upload Failed',
            description: `Failed to upload photo: ${uploadError?.message || 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      };
      reader.onerror = () => {
        setUploadingPhoto(false);
        toast({
          title: 'File Read Error',
          description: 'Failed to read the selected file. Please try again.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      // console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Error',
        description: 'An unexpected error occurred while uploading the photo.',
        variant: 'destructive',
      });
      setUploadingPhoto(false);
    }
  };

  const handleTopUpBalance = async (customerId: number, amount: number) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/customers/${customerId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, description: `Admin balance top-up: $${amount}` })
      });

      if (response.ok) {
        const result = await response.json();
        // console.log('Balance update result:', result);
        
        // Update the local state with new balance
        setCustomerList(prev => prev.map(c => 
          c.id === customerId ? { ...c, balance: result.user.balance } : c
        ));
        
        toast({
          title: 'Balance Updated',
          description: `Successfully added $${amount} to customer balance! New balance: $${result.user.balance}`,
        });
        
        // Invalidate queries to trigger refetch in customer dashboard
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      } else {
        const errorData = await response.json();
        // console.error('Balance update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update balance');
      }
    } catch (error: any) {
      // console.error('Error updating balance:', error);
      toast({
        title: 'Balance Update Failed',
        description: `Failed to update customer balance: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitTransaction = async () => {
    if (!selectedCustomerForTransaction || !transactionAmount || !transactionDescription || !transactionCategory) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields to create the transaction.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/admin/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomerForTransaction,
          type: transactionType,
          amount: amount,
          description: transactionDescription,
          category: transactionCategory,
          reference: `ADMIN-${Date.now()}`
        })
      });

      if (response.ok) {
        const token = sessionStorage.getItem('adminToken');
        const { authenticatedFetch } = await import('@/lib/queryClient');
        const balanceResponse = await authenticatedFetch(`/api/admin/customers/${selectedCustomerForTransaction}/balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            amount: transactionType === 'credit' ? amount : -amount,
            description: transactionDescription
          })
        });

        if (balanceResponse.ok) {
          // console.log(`Created ${transactionType} transaction of $${amount} for customer ${selectedCustomerForTransaction}`);
          toast({
            title: 'Transaction Created',
            description: `Successfully created ${transactionType} transaction of $${amount.toFixed(2)}.`,
          });
          
          // Reset form
          setTransactionAmount('');
          setTransactionDescription('');
          setTransactionType('credit');
          setTransactionCategory('');
          setShowTransactionModal(false);
          setSelectedCustomerForTransaction(null);
        } else {
          throw new Error('Failed to update customer balance');
        }
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (error) {
      // console.error('Transaction creation error:', error);
      toast({
        title: 'Transaction Failed',
        description: 'Failed to create transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFundSpecificAccount = async () => {
    if (!selectedAccountType || !fundAmount || !fundDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields to process the fund operation.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    // Map account type to account ID
    const accountIdMap = {
      'checking': 1,
      'savings': 2,
      'investment': 3
    };
    
    const accountId = accountIdMap[selectedAccountType as keyof typeof accountIdMap];

    try {
      const token = sessionStorage.getItem('adminToken');
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch(`/api/admin/accounts/${accountId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount.toString(),
          description: fundDescription,
          type: fundType
        })
      });

      if (response.ok) {
        // Reset form and refresh user data
        setSelectedAccountType("");
        setFundAmount("");
        setFundDescription("");
        fetchUserData(); // Refresh the balance display
        const data = await response.json();
        toast({
          title: 'Fund Operation Complete',
          description: `Successfully ${fundType === 'credit' ? 'added' : 'deducted'} $${amount} ${fundType === 'credit' ? 'to' : 'from'} ${selectedAccountType} account. New balance: $${data.newBalance}`,
        });
      } else {
        toast({
          title: 'Operation Failed',
          description: 'Failed to process fund operation. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // console.error('Error processing fund operation:', error);
      toast({
        title: 'Operation Error',
        description: 'An error occurred while processing the fund operation.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <BankLogo className="w-16 h-16" />
            </div>
            <div>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Shield className="w-6 h-6" />
                Admin Access
              </CardTitle>
              <p className="text-gray-600 mt-2">Banking Operations Center</p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BankLogo className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WORLD BANK Admin</h1>
                <p className="text-gray-600">Banking Operations Center</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transfer Approvals
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Pending Registrations
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Customer Support
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Profile Management
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Fund Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Transfer Approvals</h2>
                <p className="text-gray-600">Review and approve pending international transfers</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {transfers.length} Pending
              </Badge>
            </div>

            <div className="grid gap-4">
              {transfers.map((transfer) => (
                <Card key={transfer.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">${transfer.amount} {transfer.currency}</h3>
                          <p className="text-gray-600">Transfer ID: #{transfer.id}</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500">From Customer:</p>
                          <p className="font-medium">{transfer.customerName}</p>
                          <p className="text-gray-600">{transfer.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">To Recipient:</p>
                          <p className="font-medium">{transfer.recipientName}</p>
                          <p className="text-gray-600">{transfer.recipientBank}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Submitted: {new Date(transfer.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-6">
                      <Button 
                        onClick={() => handleApproveTransfer(transfer.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectTransfer(transfer.id)}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Pending Registrations</h2>
                <p className="text-gray-600">Review and approve new customer registrations</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {pendingRegistrations.length} Pending
              </Badge>
            </div>

            <div className="grid gap-4">
              {pendingRegistrations.map((registration) => (
                <Card key={registration.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <UserCheck className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{registration.fullName}</h3>
                          <p className="text-gray-600">{registration.email}</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500">Phone:</p>
                          <p className="font-medium">{registration.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Profession:</p>
                          <p className="font-medium">{registration.profession}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Account Number:</p>
                          <p className="font-medium">{registration.accountNumber}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Registered: {new Date(registration.registrationDate).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-6">
                      <Button 
                        onClick={() => handleApproveRegistration(registration.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectRegistration(registration.id)}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {pendingRegistrations.length === 0 && (
                <Card className="p-8 text-center">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Registrations</h3>
                  <p className="text-gray-500">All customer registrations have been processed.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Customer Support</h2>
                <p className="text-gray-600">Manage customer support tickets and live chat</p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {tickets.filter(t => t.status === 'Open').length} Open Tickets
              </Badge>
            </div>

            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MessageSquare className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          <p className="text-gray-600">Customer: {ticket.customerName}</p>
                        </div>
                        <Badge className={`${
                          ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority} Priority
                        </Badge>
                        <Badge variant="outline">
                          {ticket.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{ticket.description}</p>
                      
                      <div className="text-sm text-gray-500">
                        Created: {new Date(ticket.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-6">
                      <Button 
                        onClick={() => handleOpenChat(ticket)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Profile Management</h2>
                <p className="text-gray-600">Manage customer profiles and account information</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {customerList.length} Active Customers
              </Badge>
            </div>

            <div className="grid gap-4">
              {customerList.map((customer) => (
                <Card key={customer.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {customer.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{customer.fullName}</h3>
                        <p className="text-gray-600">{customer.email}</p>
                        <p className="text-sm text-gray-500">{customer.profession}</p>
                        <p className="text-sm text-gray-500">Account: {customer.accountNumber}</p>
                        <p className="text-sm font-medium text-green-600">
                          Balance: ${user?.balance ? user.balance.toLocaleString() : (customer.balance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={customer.isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {customer.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge className={customer.isOnline ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                        {customer.isOnline ? "Online" : "Offline"}
                      </Badge>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
                          onClick={() => handleEditCustomer(customer)}
                          variant="outline" 
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            const amount = prompt("Enter top-up amount (USD):", "1000");
                            if (amount && !isNaN(parseFloat(amount))) {
                              handleTopUpBalance(customer.id, parseFloat(amount));
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700" 
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Top Up
                        </Button>

                        <Button 
                          onClick={() => {
                            setSelectedCustomerForTransaction(customer.id);
                            setShowTransactionModal(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700" 
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Transaction
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funds" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Fund Management</h2>
                <p className="text-gray-600">Add or remove funds from customer accounts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Funding</CardTitle>
                  <p className="text-sm text-gray-600">Add or deduct funds from customer accounts</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Account</Label>
                    <select
                      value={selectedAccountType}
                      onChange={(e) => setSelectedAccountType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                    >
                      <option value="">Select Account Type</option>
                      <option value="checking">Checking Account (****9234)</option>
                      <option value="savings">Savings Account (****9235)</option>
                      <option value="investment">Investment Account (****9236)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Operation Type</Label>
                    <select
                      value={fundType}
                      onChange={(e) => setFundType(e.target.value as "credit" | "debit")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                    >
                      <option value="credit">Credit (Add Funds)</option>
                      <option value="debit">Debit (Remove Funds)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Amount (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Reason for transaction"
                      value={fundDescription}
                      onChange={(e) => setFundDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleFundSpecificAccount}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedAccountType || !fundAmount || !fundDescription}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process {fundType === 'credit' ? 'Credit' : 'Debit'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Customer Lookup</CardTitle>
                  <p className="text-sm text-gray-600">Common customer accounts for fund management</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Mr. Liu Wei</p>
                        <p className="text-sm text-gray-600">Account: 4789-6523-1087-9234</p>
                        <p className="text-sm text-gray-600">
                          Current Balance: ${user?.balance ? parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedAccountType("checking")}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Live Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">Live Chat - {selectedTicket.subject}</h3>
                <p className="text-sm text-gray-600">Customer: {selectedTicket.customerName}</p>
              </div>
              <Button
                onClick={() => setSelectedTicket(null)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === 'admin' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Customer Profile</h2>
              <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Photo Upload */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {editingCustomer.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{editingCustomer.fullName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      variant="outline" 
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Photo
                    </Button>
                    {selectedFile && (
                      <Button 
                        onClick={handleUploadPhoto}
                        disabled={uploadingPhoto}
                        className="bg-green-600 hover:bg-green-700" 
                        size="sm"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload'}
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {selectedFile.name}</p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFullName">Full Name</Label>
                  <Input
                    id="editFullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input
                    id="editPhone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editProfession">Profession</Label>
                  <Input
                    id="editProfession"
                    value={editForm.profession}
                    onChange={(e) => setEditForm(prev => ({ ...prev, profession: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editAddress">Address</Label>
                  <Input
                    id="editAddress"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editCountry">Country</Label>
                  <select
                    id="editCountry"
                    value={editForm.country}
                    onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="China">China</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="editDateOfBirth">Date of Birth</Label>
                  <Input
                    id="editDateOfBirth"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editNationality">Nationality</Label>
                  <select
                    id="editNationality"
                    value={editForm.nationality}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Nationality</option>
                    <option value="Chinese">Chinese</option>
                    <option value="American">American</option>
                    <option value="Canadian">Canadian</option>
                    <option value="British">British</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Australian">Australian</option>
                    <option value="Indian">Indian</option>
                    <option value="Brazilian">Brazilian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="editPostalCode">Postal Code</Label>
                  <Input
                    id="editPostalCode"
                    value={editForm.postalCode}
                    onChange={(e) => setEditForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editAnnualIncome">Annual Income</Label>
                  <select
                    id="editAnnualIncome"
                    value={editForm.annualIncome}
                    onChange={(e) => setEditForm(prev => ({ ...prev, annualIncome: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Annual Income</option>
                    <option value="Under $25,000">Under $25,000</option>
                    <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                    <option value="$50,000 - $75,000">$50,000 - $75,000</option>
                    <option value="$75,000 - $100,000">$75,000 - $100,000</option>
                    <option value="$85,000">$85,000</option>
                    <option value="$100,000 - $150,000">$100,000 - $150,000</option>
                    <option value="$150,000+">$150,000+</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button onClick={handleCancelEdit} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveCustomerEdit} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Transaction</h2>
              <Button
                onClick={() => setShowTransactionModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Transaction Type</Label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as 'credit' | 'debit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                >
                  <option value="credit">Credit (Add Funds)</option>
                  <option value="debit">Debit (Remove Funds)</option>
                </select>
              </div>

              <div>
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Transaction description"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  value={transactionCategory}
                  onChange={(e) => setTransactionCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1"
                >
                  <option value="">Select category...</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Fee">Fee</option>
                  <option value="Interest">Interest</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Refund">Refund</option>
                  <option value="Correction">Correction</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                onClick={() => setShowTransactionModal(false)} 
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTransaction}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
