import { useState, useEffect } from "react";
import type { User } from "@packages/shared/schema";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/queryClient";
import { MapPin, Search, Navigation, Clock, Phone, Car, Accessibility, Banknote, CreditCard, Users, Building, Globe } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  contact_phone?: string;
  hours?: string;
  opening_hours?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  distance?: string;
  services?: string[];
  amenities?: string[];
}
interface ATM {
  id: string;
  name: string;
  address: string;
  location?: string;
  available?: boolean;
  lat?: number;
  lng?: number;
  distance?: string;
  features?: string[];
}

export default function FindBranches() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const { data: branches = [], isLoading: branchesLoading, error: branchesError } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    }
  });

  const { data: atms = [], isLoading: atmsLoading, error: atmsError } = useQuery<ATM[]>({
    queryKey: ['/api/atms'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/atms');
      if (!res.ok) throw new Error('Failed to fetch ATMs');
      return res.json();
    }
  });

  const isLoading = userLoading || branchesLoading || atmsLoading;
  const queryError = userError || branchesError || atmsError;

  useEffect(() => {
    if (queryError) toast({ title: 'Error loading data', variant: 'destructive' });
  }, [queryError, toast]);

  const filteredBranches = branches.filter((b: Branch) =>
    !searchQuery || b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || b.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredATMs = atms.filter((a: ATM) =>
    !searchQuery || a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as User | undefined} />
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <h1 className="text-2xl font-bold mb-2">Find Branches & ATMs</h1>
        <p className="text-gray-600 mb-6">Locate nearby branches and ATMs</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or address..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Building className="w-5 h-5" />Branches ({filteredBranches.length})</h2>
            <div className="space-y-3">
              {filteredBranches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No branches found</p>
              ) : (
                filteredBranches.map((branch: Branch) => (
                  <Card key={branch.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{branch.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{branch.address}</p>
                          {(branch.phone || branch.contact_phone) && <p className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{branch.phone || branch.contact_phone}</p>}
                          {(branch.hours || branch.opening_hours) && <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{branch.hours || branch.opening_hours}</p>}
                        </div>
                        {branch.distance && <Badge variant="outline">{branch.distance}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Banknote className="w-5 h-5" />ATMs ({filteredATMs.length})</h2>
            <div className="space-y-3">
              {filteredATMs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No ATMs found</p>
              ) : (
                filteredATMs.map((atm: ATM) => (
                  <Card key={atm.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{atm.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{atm.address}</p>
                          {atm.features && atm.features.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {atm.features.map((f, idx) => <Badge key={idx} variant="outline" className="text-xs">{f}</Badge>)}
                            </div>
                          )}
                        </div>
                        {atm.available !== undefined && (
                          <Badge className={atm.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {atm.available ? 'Available' : 'Offline'}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
