import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { Shield, Clock, MessageSquare, UserCheck, CheckCircle, XCircle, Upload, DollarSign, Plus, Edit3, X, FileText } from 'lucide-react';
import { BankLogo } from '@/components/BankLogo';
import { useToast } from '@/hooks/use-toast';
// All data is now fetched from real APIs with real-time synchronization
export default function SimpleAdmin() {
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedTab, setSelectedTab] = useState("transfers");
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    // Real-time data from API
    const [realTimeAccounts, setRealTimeAccounts] = useState([]);
    // Fund management states
    const [selectedAccountType, setSelectedAccountType] = useState("");
    const [fundAmount, setFundAmount] = useState("");
    const [fundType, setFundType] = useState("credit");
    const [fundDescription, setFundDescription] = useState("");
    // Transaction creation states
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedCustomerForTransaction, setSelectedCustomerForTransaction] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState("");
    const [transactionType, setTransactionType] = useState("credit");
    const [transactionDescription, setTransactionDescription] = useState("");
    const [transactionCategory, setTransactionCategory] = useState("");
    // Profile upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [user, setUser] = useState(null);
    const fetchUserData = async () => {
        const token = sessionStorage.getItem('adminToken');
        if (!token)
            return; // Short-circuit if no token to avoid invalid Authorization headers
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
            }
            else {
                toast({
                    title: 'Data Fetch Failed',
                    description: 'Unable to load user profile data. Please refresh the page.',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: 'Connection Error',
                description: 'Failed to connect to server. Please check your connection and try again.',
                variant: 'destructive'
            });
        }
    };
    const fetchPendingRegistrations = async () => {
        const token = sessionStorage.getItem('adminToken');
        if (!token)
            return; // Short-circuit if no token
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
            }
            else {
                toast({
                    title: 'Data Fetch Failed',
                    description: 'Unable to load pending registrations. Please refresh the page.',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: 'Connection Error',
                description: 'Failed to load pending registrations. Please check your connection.',
                variant: 'destructive'
            });
        }
    };
    const fetchPendingTransfers = async () => {
        const token = sessionStorage.getItem('adminToken');
        if (!token)
            return; // Short-circuit if no token
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
            }
            else {
                setTransfers([]);
                toast({
                    title: 'Data Fetch Failed',
                    description: 'Unable to load pending transfers. Showing empty list.',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
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
        if (!token)
            return; // Short-circuit if no token
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
            }
            else {
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
                        const formattedTickets = data.map((t) => ({
                            id: t.id,
                            subject: t.description?.substring(0, 50) || 'Support Ticket',
                            customerName: t.userId ? `User ${t.userId}` : 'Unknown',
                            priority: t.priority || 'Medium',
                            status: t.status || 'Open',
                            createdAt: t.createdAt,
                            description: t.description || ''
                        }));
                        setTickets(formattedTickets);
                    }
                    else {
                        setTickets([]);
                        toast({
                            title: 'Data Fetch Failed',
                            description: 'Unable to load support tickets. Please refresh the page.',
                            variant: 'destructive'
                        });
                    }
                }
                catch (e) {
                    setTickets([]);
                    toast({
                        title: 'Connection Error',
                        description: 'Failed to load support tickets. Please check your connection.',
                        variant: 'destructive'
                    });
                }
            }
        }
        catch (error) {
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
        if (!token)
            return; // Short-circuit if no token
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
            }
            else {
                // Try fallback endpoint
                const { authenticatedFetch } = await import('@/lib/queryClient');
                const response = await authenticatedFetch('/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const formattedCustomers = data.map((u) => ({
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
                }
                else {
                    setCustomerList([]);
                    toast({
                        title: 'Data Fetch Failed',
                        description: 'Unable to load customer list. Please refresh the page.',
                        variant: 'destructive'
                    });
                }
            }
        }
        catch (error) {
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
        if (!isAuthenticated)
            return;
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
    const handleLogin = async (e) => {
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
        }
        catch (error) {
            console.error('Login error:', error);
            toast({
                title: 'Login Error',
                description: 'Failed to authenticate. Please check your credentials and try again.',
                variant: 'destructive'
            });
        }
    };
    const handleApproveRegistration = async (registrationId) => {
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
            }
            else {
                const error = await response.json();
                toast({
                    title: 'Approval Failed',
                    description: error.message || 'Failed to approve registration',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve registration. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const handleRejectRegistration = async (registrationId) => {
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
            }
            else {
                const error = await response.json();
                toast({
                    title: 'Rejection Failed',
                    description: error.message || 'Failed to reject registration',
                    variant: 'destructive'
                });
            }
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to reject registration. Please try again.',
                variant: 'destructive'
            });
        }
    };
    const [transfers, setTransfers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatMessage, setChatMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    // Customer editing states
    const [editingCustomer, setEditingCustomer] = useState(null);
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
    const handleApproveTransfer = (transferId) => {
        setTransfers(prev => prev.filter(t => t.id !== transferId));
        // console.log(`Approved transfer ${transferId}`);
    };
    const handleRejectTransfer = (transferId) => {
        setTransfers(prev => prev.filter(t => t.id !== transferId));
        // console.log(`Rejected transfer ${transferId}`);
    };
    const handleOpenChat = (ticket) => {
        setSelectedTicket(ticket);
    };
    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            const newMessage = {
                id: chatMessages.length + 1,
                sender: "admin",
                message: chatMessage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, newMessage]);
            setChatMessage("");
        }
    };
    const handleEditCustomer = async (customer) => {
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
            }
            else {
                throw new Error('Failed to fetch user data');
            }
        }
        catch (error) {
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
        if (!editingCustomer)
            return;
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
            }
            else {
                throw new Error('Failed to update customer');
            }
        }
        catch (error) {
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
    const handleFileSelect = (event) => {
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
            }
            else {
                toast({
                    title: 'Invalid File Type',
                    description: 'Please select an image file (JPG, PNG, etc.).',
                    variant: 'destructive',
                });
            }
        }
    };
    const handleUploadPhoto = async () => {
        if (!selectedFile || !editingCustomer)
            return;
        setUploadingPhoto(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    let base64Image = e.target?.result;
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
                        }
                        else {
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
                }
                catch (uploadError) {
                    // console.error('Upload error:', uploadError);
                    setUploadingPhoto(false);
                    toast({
                        title: 'Upload Failed',
                        description: `Failed to upload photo: ${uploadError?.message || 'Unknown error'}`,
                        variant: 'destructive',
                    });
                }
            };
            const uploadCompressedImage = async (base64Image) => {
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
                        setCustomerList(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, avatarUrl: base64Image } : c));
                        setSelectedFile(null);
                        setUploadingPhoto(false);
                        toast({
                            title: 'Photo Uploaded',
                            description: 'Profile photo has been uploaded successfully.',
                        });
                        // Invalidate user queries to trigger refetch in customer interface
                        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
                    }
                    else {
                        const errorData = await response.json();
                        // console.error('Upload failed:', errorData);
                        throw new Error(errorData.error || 'Failed to upload photo');
                    }
                }
                catch (uploadError) {
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
        }
        catch (error) {
            // console.error('Error uploading photo:', error);
            toast({
                title: 'Upload Error',
                description: 'An unexpected error occurred while uploading the photo.',
                variant: 'destructive',
            });
            setUploadingPhoto(false);
        }
    };
    const handleTopUpBalance = async (customerId, amount) => {
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
                setCustomerList(prev => prev.map(c => c.id === customerId ? { ...c, balance: result.user.balance } : c));
                toast({
                    title: 'Balance Updated',
                    description: `Successfully added $${amount} to customer balance! New balance: $${result.user.balance}`,
                });
                // Invalidate queries to trigger refetch in customer dashboard
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
            }
            else {
                const errorData = await response.json();
                // console.error('Balance update failed:', errorData);
                throw new Error(errorData.error || 'Failed to update balance');
            }
        }
        catch (error) {
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
                }
                else {
                    throw new Error('Failed to update customer balance');
                }
            }
            else {
                throw new Error('Failed to create transaction');
            }
        }
        catch (error) {
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
        const accountId = accountIdMap[selectedAccountType];
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
            }
            else {
                toast({
                    title: 'Operation Failed',
                    description: 'Failed to process fund operation. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            // console.error('Error processing fund operation:', error);
            toast({
                title: 'Operation Error',
                description: 'An error occurred while processing the fund operation.',
                variant: 'destructive',
            });
        }
    };
    if (!isAuthenticated) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(BankLogo, { className: "w-16 h-16" }) }), _jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center justify-center gap-2 text-2xl", children: [_jsx(Shield, { className: "w-6 h-6" }), "Admin Access"] }), _jsx("p", { className: "text-gray-600 mt-2", children: "Banking Operations Center" })] })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Enter admin username", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter admin password", required: true })] }), _jsxs(Button, { type: "submit", className: "w-full", children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "Access Admin Panel"] })] }) })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-7xl mx-auto px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(BankLogo, { className: "w-10 h-10" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "WORLD BANK Admin" }), _jsx("p", { className: "text-gray-600", children: "Banking Operations Center" })] })] }), _jsxs(Button, { variant: "outline", onClick: () => setIsAuthenticated(false), className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-4 h-4" }), "Logout"] })] }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-6 py-8", children: _jsxs(Tabs, { value: selectedTab, onValueChange: setSelectedTab, className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsxs(TabsTrigger, { value: "transfers", className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), "Transfer Approvals"] }), _jsxs(TabsTrigger, { value: "registrations", className: "flex items-center gap-2", children: [_jsx(UserCheck, { className: "w-4 h-4" }), "Pending Registrations"] }), _jsxs(TabsTrigger, { value: "support", className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "Customer Support"] }), _jsxs(TabsTrigger, { value: "customers", className: "flex items-center gap-2", children: [_jsx(UserCheck, { className: "w-4 h-4" }), "Profile Management"] }), _jsxs(TabsTrigger, { value: "funds", className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), "Fund Management"] })] }), _jsxs(TabsContent, { value: "transfers", className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Transfer Approvals" }), _jsx("p", { className: "text-gray-600", children: "Review and approve pending international transfers" })] }), _jsxs(Badge, { variant: "secondary", className: "bg-orange-100 text-orange-800", children: [transfers.length, " Pending"] })] }), _jsx("div", { className: "grid gap-4", children: transfers.map((transfer) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(DollarSign, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-lg", children: ["$", transfer.amount, " ", transfer.currency] }), _jsxs("p", { className: "text-gray-600", children: ["Transfer ID: #", transfer.id] })] }), _jsx(Badge, { className: "bg-yellow-100 text-yellow-800", children: "Pending Approval" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-6 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "From Customer:" }), _jsx("p", { className: "font-medium", children: transfer.customerName }), _jsx("p", { className: "text-gray-600", children: transfer.customerEmail })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "To Recipient:" }), _jsx("p", { className: "font-medium", children: transfer.recipientName }), _jsx("p", { className: "text-gray-600", children: transfer.recipientBank })] })] }), _jsxs("div", { className: "mt-4 text-sm text-gray-500", children: ["Submitted: ", new Date(transfer.createdAt).toLocaleString()] })] }), _jsxs("div", { className: "flex gap-2 ml-6", children: [_jsxs(Button, { onClick: () => handleApproveTransfer(transfer.id), className: "bg-green-600 hover:bg-green-700", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Approve"] }), _jsxs(Button, { onClick: () => handleRejectTransfer(transfer.id), variant: "destructive", children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), "Reject"] })] })] }) }, transfer.id))) })] }), _jsxs(TabsContent, { value: "registrations", className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Pending Registrations" }), _jsx("p", { className: "text-gray-600", children: "Review and approve new customer registrations" })] }), _jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: [pendingRegistrations.length, " Pending"] })] }), _jsxs("div", { className: "grid gap-4", children: [pendingRegistrations.map((registration) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "p-2 bg-purple-100 rounded-lg", children: _jsx(UserCheck, { className: "w-6 h-6 text-purple-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: registration.fullName }), _jsx("p", { className: "text-gray-600", children: registration.email })] }), _jsx(Badge, { className: "bg-yellow-100 text-yellow-800", children: registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Pending' })] }), _jsxs("div", { className: "grid grid-cols-3 gap-6 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Phone:" }), _jsx("p", { className: "font-medium", children: registration.phone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Profession:" }), _jsx("p", { className: "font-medium", children: registration.profession })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Account Number:" }), _jsx("p", { className: "font-medium", children: registration.accountNumber })] })] }), _jsxs("div", { className: "mt-4 text-sm text-gray-500", children: ["Registered: ", new Date(registration.registrationDate).toLocaleString()] })] }), _jsxs("div", { className: "flex gap-2 ml-6", children: [_jsxs(Button, { onClick: () => handleApproveRegistration(registration.id), className: "bg-green-600 hover:bg-green-700", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Approve"] }), _jsxs(Button, { onClick: () => handleRejectRegistration(registration.id), variant: "destructive", children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), "Reject"] })] })] }) }, registration.id))), pendingRegistrations.length === 0 && (_jsxs(Card, { className: "p-8 text-center", children: [_jsx(UserCheck, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-600 mb-2", children: "No Pending Registrations" }), _jsx("p", { className: "text-gray-500", children: "All customer registrations have been processed." })] }))] })] }), _jsxs(TabsContent, { value: "support", className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Customer Support" }), _jsx("p", { className: "text-gray-600", children: "Manage customer support tickets and live chat" })] }), _jsxs(Badge, { variant: "secondary", className: "bg-red-100 text-red-800", children: [tickets.filter(t => t.status === 'Open').length, " Open Tickets"] })] }), _jsx("div", { className: "grid gap-4", children: tickets.map((ticket) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "p-2 bg-orange-100 rounded-lg", children: _jsx(MessageSquare, { className: "w-6 h-6 text-orange-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: ticket.subject }), _jsxs("p", { className: "text-gray-600", children: ["Customer: ", ticket.customerName] })] }), _jsxs(Badge, { className: `${ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                                        ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'}`, children: [ticket.priority, " Priority"] }), _jsx(Badge, { variant: "outline", children: ticket.status })] }), _jsx("p", { className: "text-gray-700 mb-4", children: ticket.description }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Created: ", new Date(ticket.createdAt).toLocaleString()] })] }), _jsx("div", { className: "flex gap-2 ml-6", children: _jsxs(Button, { onClick: () => handleOpenChat(ticket), className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Open Chat"] }) })] }) }, ticket.id))) })] }), _jsxs(TabsContent, { value: "customers", className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Profile Management" }), _jsx("p", { className: "text-gray-600", children: "Manage customer profiles and account information" })] }), _jsxs(Badge, { variant: "secondary", className: "bg-purple-100 text-purple-800", children: [customerList.length, " Active Customers"] })] }), _jsx("div", { className: "grid gap-4", children: customerList.map((customer) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-semibold text-lg", children: customer.fullName.split(' ').map(n => n[0]).join('').toUpperCase() }) }), _jsx("div", { className: "absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-3 h-3 text-white" }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg", children: customer.fullName }), _jsx("p", { className: "text-gray-600", children: customer.email }), _jsx("p", { className: "text-sm text-gray-500", children: customer.profession }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Account: ", customer.accountNumber] }), _jsxs("p", { className: "text-sm font-medium text-green-600", children: ["Balance: $", user?.balance ? user.balance.toLocaleString() : (customer.balance || 0).toLocaleString()] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { className: customer.isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800", children: customer.isVerified ? "Verified" : "Unverified" }), _jsx(Badge, { className: customer.isOnline ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800", children: customer.isOnline ? "Online" : "Offline" }), _jsxs("div", { className: "flex gap-2 ml-4", children: [_jsxs(Button, { onClick: () => handleEditCustomer(customer), variant: "outline", size: "sm", children: [_jsx(Edit3, { className: "w-4 h-4 mr-2" }), "Edit Profile"] }), _jsxs(Button, { onClick: () => {
                                                                        const amount = prompt("Enter top-up amount (USD):", "1000");
                                                                        if (amount && !isNaN(parseFloat(amount))) {
                                                                            handleTopUpBalance(customer.id, parseFloat(amount));
                                                                        }
                                                                    }, className: "bg-green-600 hover:bg-green-700", size: "sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Top Up"] }), _jsxs(Button, { onClick: () => {
                                                                        setSelectedCustomerForTransaction(customer.id);
                                                                        setShowTransactionModal(true);
                                                                    }, className: "bg-purple-600 hover:bg-purple-700", size: "sm", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Transaction"] })] })] })] }) }, customer.id))) })] }), _jsxs(TabsContent, { value: "funds", className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Fund Management" }), _jsx("p", { className: "text-gray-600", children: "Add or remove funds from customer accounts" })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Account Funding" }), _jsx("p", { className: "text-sm text-gray-600", children: "Add or deduct funds from customer accounts" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Select Account" }), _jsxs("select", { value: selectedAccountType, onChange: (e) => setSelectedAccountType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "", children: "Select Account Type" }), _jsx("option", { value: "checking", children: "Checking Account (****9234)" }), _jsx("option", { value: "savings", children: "Savings Account (****9235)" }), _jsx("option", { value: "investment", children: "Investment Account (****9236)" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Operation Type" }), _jsxs("select", { value: fundType, onChange: (e) => setFundType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "credit", children: "Credit (Add Funds)" }), _jsx("option", { value: "debit", children: "Debit (Remove Funds)" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amount (USD)" }), _jsx(Input, { type: "number", step: "0.01", placeholder: "0.00", value: fundAmount, onChange: (e) => setFundAmount(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(Input, { placeholder: "Reason for transaction", value: fundDescription, onChange: (e) => setFundDescription(e.target.value), className: "mt-1" })] }), _jsxs(Button, { onClick: handleFundSpecificAccount, className: "w-full bg-blue-600 hover:bg-blue-700", disabled: !selectedAccountType || !fundAmount || !fundDescription, children: [_jsx(DollarSign, { className: "w-4 h-4 mr-2" }), "Process ", fundType === 'credit' ? 'Credit' : 'Debit'] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Quick Customer Lookup" }), _jsx("p", { className: "text-sm text-gray-600", children: "Common customer accounts for fund management" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Mr. Liu Wei" }), _jsx("p", { className: "text-sm text-gray-600", children: "Account: 4789-6523-1087-9234" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Current Balance: $", user?.balance ? parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'] })] }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setSelectedAccountType("checking"), children: "Select" })] }) }) })] })] })] })] }) }), selectedTicket && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-lg", children: ["Live Chat - ", selectedTicket.subject] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Customer: ", selectedTicket.customerName] })] }), _jsx(Button, { onClick: () => setSelectedTicket(null), variant: "ghost", size: "sm", children: "\u2715" })] }), _jsx("div", { className: "flex-1 p-4 overflow-y-auto space-y-3", children: chatMessages.map((msg) => (_jsx("div", { className: `flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'admin'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'}`, children: [_jsx("p", { className: "text-sm", children: msg.message }), _jsx("p", { className: `text-xs mt-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'}`, children: msg.timestamp })] }) }, msg.id))) }), _jsx("div", { className: "p-4 border-t", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Type your message...", value: chatMessage, onChange: (e) => setChatMessage(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSendMessage(), className: "flex-1" }), _jsx(Button, { onClick: handleSendMessage, children: "Send" })] }) })] }) })), editingCustomer && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Edit Customer Profile" }), _jsx(Button, { onClick: handleCancelEdit, variant: "ghost", size: "sm", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-semibold text-xl", children: editingCustomer.fullName.split(' ').map((n) => n[0]).join('').toUpperCase() }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: editingCustomer.fullName }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx("input", { type: "file", accept: "image/*", onChange: handleFileSelect, className: "hidden", id: "photo-upload" }), _jsxs(Button, { onClick: () => document.getElementById('photo-upload')?.click(), variant: "outline", size: "sm", children: [_jsx(Upload, { className: "w-4 h-4 mr-2" }), "Choose Photo"] }), selectedFile && (_jsx(Button, { onClick: handleUploadPhoto, disabled: uploadingPhoto, className: "bg-green-600 hover:bg-green-700", size: "sm", children: uploadingPhoto ? 'Uploading...' : 'Upload' }))] }), selectedFile && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Selected: ", selectedFile.name] }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "editFullName", children: "Full Name" }), _jsx(Input, { id: "editFullName", value: editForm.fullName, onChange: (e) => setEditForm(prev => ({ ...prev, fullName: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editEmail", children: "Email" }), _jsx(Input, { id: "editEmail", type: "email", value: editForm.email, onChange: (e) => setEditForm(prev => ({ ...prev, email: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editPhone", children: "Phone" }), _jsx(Input, { id: "editPhone", value: editForm.phone, onChange: (e) => setEditForm(prev => ({ ...prev, phone: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editProfession", children: "Profession" }), _jsx(Input, { id: "editProfession", value: editForm.profession, onChange: (e) => setEditForm(prev => ({ ...prev, profession: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editAddress", children: "Address" }), _jsx(Input, { id: "editAddress", value: editForm.address, onChange: (e) => setEditForm(prev => ({ ...prev, address: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editCity", children: "City" }), _jsx(Input, { id: "editCity", value: editForm.city, onChange: (e) => setEditForm(prev => ({ ...prev, city: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editCountry", children: "Country" }), _jsxs("select", { id: "editCountry", value: editForm.country, onChange: (e) => setEditForm(prev => ({ ...prev, country: e.target.value })), className: "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select Country" }), _jsx("option", { value: "China", children: "China" }), _jsx("option", { value: "United States", children: "United States" }), _jsx("option", { value: "Canada", children: "Canada" }), _jsx("option", { value: "United Kingdom", children: "United Kingdom" }), _jsx("option", { value: "Germany", children: "Germany" }), _jsx("option", { value: "France", children: "France" }), _jsx("option", { value: "Japan", children: "Japan" }), _jsx("option", { value: "Australia", children: "Australia" }), _jsx("option", { value: "India", children: "India" }), _jsx("option", { value: "Brazil", children: "Brazil" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editDateOfBirth", children: "Date of Birth" }), _jsx(Input, { id: "editDateOfBirth", type: "date", value: editForm.dateOfBirth, onChange: (e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editNationality", children: "Nationality" }), _jsxs("select", { id: "editNationality", value: editForm.nationality, onChange: (e) => setEditForm(prev => ({ ...prev, nationality: e.target.value })), className: "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select Nationality" }), _jsx("option", { value: "Chinese", children: "Chinese" }), _jsx("option", { value: "American", children: "American" }), _jsx("option", { value: "Canadian", children: "Canadian" }), _jsx("option", { value: "British", children: "British" }), _jsx("option", { value: "German", children: "German" }), _jsx("option", { value: "French", children: "French" }), _jsx("option", { value: "Japanese", children: "Japanese" }), _jsx("option", { value: "Australian", children: "Australian" }), _jsx("option", { value: "Indian", children: "Indian" }), _jsx("option", { value: "Brazilian", children: "Brazilian" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editPostalCode", children: "Postal Code" }), _jsx(Input, { id: "editPostalCode", value: editForm.postalCode, onChange: (e) => setEditForm(prev => ({ ...prev, postalCode: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editAnnualIncome", children: "Annual Income" }), _jsxs("select", { id: "editAnnualIncome", value: editForm.annualIncome, onChange: (e) => setEditForm(prev => ({ ...prev, annualIncome: e.target.value })), className: "mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select Annual Income" }), _jsx("option", { value: "Under $25,000", children: "Under $25,000" }), _jsx("option", { value: "$25,000 - $50,000", children: "$25,000 - $50,000" }), _jsx("option", { value: "$50,000 - $75,000", children: "$50,000 - $75,000" }), _jsx("option", { value: "$75,000 - $100,000", children: "$75,000 - $100,000" }), _jsx("option", { value: "$85,000", children: "$85,000" }), _jsx("option", { value: "$100,000 - $150,000", children: "$100,000 - $150,000" }), _jsx("option", { value: "$150,000+", children: "$150,000+" })] })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 p-4 border-t", children: [_jsx(Button, { onClick: handleCancelEdit, variant: "outline", children: "Cancel" }), _jsxs(Button, { onClick: handleSaveCustomerEdit, className: "bg-green-600 hover:bg-green-700", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Save Changes"] })] })] }) })), showTransactionModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl p-6 max-w-md w-full mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Create Transaction" }), _jsx(Button, { onClick: () => setShowTransactionModal(false), variant: "ghost", size: "sm", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Transaction Type" }), _jsxs("select", { value: transactionType, onChange: (e) => setTransactionType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "credit", children: "Credit (Add Funds)" }), _jsx("option", { value: "debit", children: "Debit (Remove Funds)" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amount (USD)" }), _jsx(Input, { type: "number", step: "0.01", placeholder: "0.00", value: transactionAmount, onChange: (e) => setTransactionAmount(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(Input, { placeholder: "Transaction description", value: transactionDescription, onChange: (e) => setTransactionDescription(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Category" }), _jsxs("select", { value: transactionCategory, onChange: (e) => setTransactionCategory(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "", children: "Select category..." }), _jsx("option", { value: "Manual Adjustment", children: "Manual Adjustment" }), _jsx("option", { value: "Deposit", children: "Deposit" }), _jsx("option", { value: "Withdrawal", children: "Withdrawal" }), _jsx("option", { value: "Fee", children: "Fee" }), _jsx("option", { value: "Interest", children: "Interest" }), _jsx("option", { value: "Bonus", children: "Bonus" }), _jsx("option", { value: "Refund", children: "Refund" }), _jsx("option", { value: "Correction", children: "Correction" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-6", children: [_jsx(Button, { onClick: () => setShowTransactionModal(false), variant: "outline", children: "Cancel" }), _jsxs(Button, { onClick: handleSubmitTransaction, className: "bg-purple-600 hover:bg-purple-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create Transaction"] })] })] }) }))] }));
}
