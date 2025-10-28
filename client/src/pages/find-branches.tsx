import type { User } from "@shared/schema";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Phone, 
  Car, 
  Accessibility,
  Banknote,
  CreditCard,
  Users,
  Building,
  Globe
} from "lucide-react";


export default function FindBranches() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch branches and ATMs from real database
  const { data: branches, isLoading: branchesLoading } = useQuery<any[]>({
    queryKey: ['/api/branches'],
  });

  const { data: atms, isLoading: atmsLoading } = useQuery<any[]>({
    queryKey: ['/api/atms'],
  });

  if (isLoading || branchesLoading || atmsLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">{t('loading')}</div>
      </div>
    );
  }

  const branchesList = branches || [];
  const atmsList = atms || [];

  const globalPresence = {
    regions: [
      { name: "North America", branches: 2847, countries: ["USA", "Canada", "Mexico"] },
      { name: "Europe", branches: 3521, countries: ["UK", "Germany", "France", "Italy", "Spain"] },
      { name: "Asia Pacific", branches: 4123, countries: ["Japan", "China", "Australia", "Singapore", "India"] },
      { name: "Middle East & Africa", branches: 1876, countries: ["UAE", "Saudi Arabia", "South Africa", "Egypt"] },
      { name: "Latin America", branches: 1654, countries: ["Brazil", "Argentina", "Chile", "Colombia"] }
    ]
  };

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold wb-dark mb-4">Find Branches & ATMs</h1>
          <p className="text-wb-text">Locate World Bank branches and ATMs worldwide</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Enter city, state, or ZIP code" 
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  Use My Location
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2">
            {/* Nearby Branches */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold wb-dark mb-6">Nearby Branches</h2>
              <div className="space-y-4">
                {branchesList.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No branches found in your area</p>
                      <p className="text-sm">Try searching in a different location</p>
                    </CardContent>
                  </Card>
                ) : (
                  branchesList.map((branch: any) => (
                    <Card key={branch.id} className="hover:shadow-md transition-shadow" data-testid={`branch-card-${branch.id}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold wb-dark mb-1" data-testid={`branch-name-${branch.id}`}>{branch.name}</h3>
                            <div className="flex items-center text-wb-text mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {branch.address}
                            </div>
                            <div className="flex items-center text-wb-text mb-2">
                              <Phone className="w-4 h-4 mr-1" />
                              {branch.phone || branch.contact_phone || 'N/A'}
                            </div>
                            <div className="flex items-center text-wb-text">
                              <Clock className="w-4 h-4 mr-1" />
                              {branch.hours || branch.opening_hours || 'Mon-Fri: 9AM-5PM'}
                            </div>
                          </div>
                          <div className="text-right">
                            {branch.distance && <div className="text-wb-blue font-semibold mb-2">{branch.distance}</div>}
                            <Button size="sm" data-testid={`branch-directions-${branch.id}`}>Get Directions</Button>
                          </div>
                        </div>
                        
                        {branch.services && branch.services.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium wb-dark mb-2">Services</div>
                            <div className="flex flex-wrap gap-1">
                              {branch.services.map((service: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {branch.amenities && branch.amenities.length > 0 && (
                          <div>
                            <div className="text-sm font-medium wb-dark mb-2">Amenities</div>
                            <div className="flex flex-wrap gap-1">
                              {branch.amenities.map((amenity: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* ATM Locations */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold wb-dark mb-6">Nearby ATMs</h2>
              <div className="space-y-3">
                {atmsList.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      <Banknote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No ATMs found nearby</p>
                    </CardContent>
                  </Card>
                ) : (
                  atmsList.map((atm: any) => (
                    <Card key={atm.id} className="hover:shadow-sm transition-shadow" data-testid={`atm-card-${atm.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium wb-dark" data-testid={`atm-location-${atm.id}`}>{atm.location}</div>
                            <div className="text-sm text-wb-text">{atm.address}</div>
                          </div>
                          <div className="text-right">
                            {atm.distance && <div className="text-wb-blue font-semibold text-sm mb-1">{atm.distance}</div>}
                            {atm.features && atm.features.length > 0 && (
                              <div className="flex gap-1">
                                {atm.features.map((feature: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Filter Options */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium mb-2">Services</div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <Banknote className="w-4 h-4 mr-1" />
                      <span className="text-sm">ATM Available</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <Users className="w-4 h-4 mr-1" />
                      <span className="text-sm">Teller Services</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <CreditCard className="w-4 h-4 mr-1" />
                      <span className="text-sm">Business Banking</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium mb-2">Amenities</div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <Car className="w-4 h-4 mr-1" />
                      <span className="text-sm">Parking Available</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <Accessibility className="w-4 h-4 mr-1" />
                      <span className="text-sm">Wheelchair Accessible</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Presence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Global Presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {globalPresence.regions.map((region, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">{region.name}</div>
                        <Badge variant="secondary">{region.branches.toLocaleString()}</Badge>
                      </div>
                      <div className="text-xs text-wb-text">
                        {region.countries.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-wb-blue-light rounded-lg text-center">
                  <div className="text-2xl font-bold wb-blue">190+</div>
                  <div className="text-sm text-wb-text">Countries Worldwide</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
