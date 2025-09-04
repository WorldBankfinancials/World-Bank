import React from "react";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation, Route, MapPin, ArrowRight, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

interface TransactionRoute {
  id: string;
  name: string;
  description: string;
  targetPage: string;
  conditions?: {
    accountType?: string;
    transactionType?: string;
    amountMin?: number;
    amountMax?: number;
  };
}

export default function TransactionRouter() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [routes, setRoutes] = useState<TransactionRoute[]>([
    {
      id: '1',
      name: 'Dashboard Route',
      description: 'Send all transactions to customer dashboard',
      targetPage: '/dashboard'
    },
    {
      id: '2', 
      name: 'History Route',
      description: 'Send all transactions to transaction history page',
      targetPage: '/history'
    },
    {
      id: '3',
      name: 'Admin Panel Route', 
      description: 'Send all transactions to admin panel',
      targetPage: '/simple-admin'
    }
  ]);
  
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    targetPage: '',
    accountType: '',
    transactionType: '',
    amountMin: '',
    amountMax: ''
  });

  const [isCreating, setIsCreating] = useState(false);

  const pageOptions = [
    { value: '/dashboard', label: 'Customer Dashboard' },
    { value: '/history', label: 'Transaction History' },
    { value: '/cards', label: 'Cards Page' },
    { value: '/transfer', label: 'Transfer Page' },
    { value: '/simple-admin', label: 'Admin Panel' },
    { value: '/profile-settings', label: 'Profile Settings' },
    { value: '/banking-services', label: 'Banking Services' },
    { value: '/statements-reports', label: 'Statements & Reports' },
    { value: '/investment-portfolio', label: 'Investment Portfolio' },
    { value: '/wealth-management', label: 'Wealth Management' },
    { value: '/support-center', label: 'Support Center' },
    { value: '/verification', label: 'Verification Center' }
  ];

  const handleCreateRoute = () => {
    if (!newRoute.name || !newRoute.targetPage) {
      // console.warn('Missing route name or target page');
      return;
    }

    const route: TransactionRoute = {
      id: Date.now().toString(),
      name: newRoute.name,
      description: newRoute.description,
      targetPage: newRoute.targetPage,
      conditions: {}
    };

    if (newRoute.accountType) route.conditions!.accountType = newRoute.accountType;
    if (newRoute.transactionType) route.conditions!.transactionType = newRoute.transactionType;
    if (newRoute.amountMin) route.conditions!.amountMin = parseFloat(newRoute.amountMin);
    if (newRoute.amountMax) route.conditions!.amountMax = parseFloat(newRoute.amountMax);

    setRoutes([...routes, route]);
    
    // Reset form
    setNewRoute({
      name: '',
      description: '',
      targetPage: '',
      accountType: '',
      transactionType: '',
      amountMin: '',
      amountMax: ''
    });
    
    setIsCreating(false);
    // console.log(`Route "${route.name}" created successfully`);
  };

  const handleDeleteRoute = (routeId: string) => {
    setRoutes(routes.filter(route => route.id !== routeId));
  };

  const handleTestRoute = (targetPage: string) => {
    setLocation(targetPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction Router</h1>
            <p className="text-gray-600 mt-1">Control where transactions navigate after creation</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50">
              <Route className="w-4 h-4 mr-1" />
              Router Control
            </Badge>
            <Button 
              onClick={() => setIsCreating(!isCreating)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              {isCreating ? 'Cancel' : 'Create Route'}
            </Button>
          </div>
        </div>

        {/* Create New Route */}
        {isCreating && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Create New Transaction Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routeName">Route Name *</Label>
                  <Input
                    id="routeName"
                    placeholder="e.g., High Value Transactions"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="targetPage">Target Page *</Label>
                  <select
                    id="targetPage"
                    value={newRoute.targetPage}
                    onChange={(e) => setNewRoute({...newRoute, targetPage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1"
                  >
                    <option value="">Select target page</option>
                    {pageOptions.map(page => (
                      <option key={page.value} value={page.value}>{page.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="accountType">Account Type Filter (Optional)</Label>
                  <select
                    id="accountType"
                    value={newRoute.accountType}
                    onChange={(e) => setNewRoute({...newRoute, accountType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1"
                  >
                    <option value="">Any account type</option>
                    <option value="checking">Checking only</option>
                    <option value="savings">Savings only</option>
                    <option value="investment">Investment only</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="transactionType">Transaction Type Filter (Optional)</Label>
                  <select
                    id="transactionType"
                    value={newRoute.transactionType}
                    onChange={(e) => setNewRoute({...newRoute, transactionType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mt-1"
                  >
                    <option value="">Any transaction type</option>
                    <option value="credit">Credits only</option>
                    <option value="debit">Debits only</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="amountMin">Minimum Amount (Optional)</Label>
                  <Input
                    id="amountMin"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRoute.amountMin}
                    onChange={(e) => setNewRoute({...newRoute, amountMin: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="amountMax">Maximum Amount (Optional)</Label>
                  <Input
                    id="amountMax"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRoute.amountMax}
                    onChange={(e) => setNewRoute({...newRoute, amountMax: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe when this route should be used"
                  value={newRoute.description}
                  onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCreateRoute} className="bg-green-600 hover:bg-green-700">
                  Create Route
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="w-5 h-5 mr-2" />
              Active Transaction Routes
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure where different types of transactions should navigate after creation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{route.name}</h3>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <MapPin className="w-3 h-3 mr-1" />
                          {route.targetPage}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                      
                      {route.conditions && Object.keys(route.conditions).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {route.conditions.accountType && (
                            <Badge variant="secondary" className="text-xs">
                              Account: {route.conditions.accountType}
                            </Badge>
                          )}
                          {route.conditions.transactionType && (
                            <Badge variant="secondary" className="text-xs">
                              Type: {route.conditions.transactionType}
                            </Badge>
                          )}
                          {route.conditions.amountMin && (
                            <Badge variant="secondary" className="text-xs">
                              Min: ${route.conditions.amountMin}
                            </Badge>
                          )}
                          {route.conditions.amountMax && (
                            <Badge variant="secondary" className="text-xs">
                              Max: ${route.conditions.amountMax}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestRoute(route.targetPage)}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use Transaction Routing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-2">
            <p><strong>1. Create Routes:</strong> Define where transactions should navigate based on conditions</p>
            <p><strong>2. Set Conditions:</strong> Filter by account type, transaction type, or amount ranges</p>
            <p><strong>3. Test Routes:</strong> Click "Test" to navigate to the target page and verify routing</p>
            <p><strong>4. Use in Transaction Creator:</strong> Select destination page when creating transactions</p>
            <p><strong>5. Automatic Routing:</strong> Transactions will automatically navigate to specified pages after creation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
