import React from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
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
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wb-gray flex items-center justify-center">
        <div className="text-wb-dark">Loading...</div>
      </div>
    );
  }

  const branches = [
    {
      name: "World Bank - Manhattan Financial District",
      address: "123 Wall Street, New York, NY 10005",
      distance: "0.5 miles",
      phone: "(212) 555-0123",
      hours: "Mon-Fri: 9AM-6PM, Sat: 9AM-3PM",
      services: ["ATM", "Teller", "Safe Deposit", "Financial Advisory"],
      amenities: ["Parking", "Wheelchair Accessible", "WiFi"]
    },
    {
      name: "World Bank - Midtown Plaza",
      address: "456 Fifth Avenue, New York, NY 10018",
      distance: "1.2 miles",
      phone: "(212) 555-0456",
      hours: "Mon-Fri: 8AM-7PM, Sat: 9AM-4PM",
      services: ["ATM", "Teller", "Business Banking", "Loans"],
      amenities: ["Parking", "Wheelchair Accessible", "Private Banking"]
    },
    {
      name: "World Bank - Brooklyn Heights",
      address: "789 Atlantic Avenue, Brooklyn, NY 11201",
      distance: "2.8 miles",
      phone: "(718) 555-0789",
      hours: "Mon-Fri: 9AM-5PM, Sat: 9AM-2PM",
      services: ["ATM", "Teller", "Mortgage Services"],
      amenities: ["Wheelchair Accessible", "WiFi"]
    },
    {
      name: "World Bank - Queens Center",
      address: "321 Northern Boulevard, Long Island City, NY 11101",
      distance: "4.1 miles",
      phone: "(718) 555-0321",
      hours: "Mon-Fri: 9AM-6PM, Sat: 9AM-3PM",
      services: ["ATM", "Teller", "Investment Advisory", "Currency Exchange"],
      amenities: ["Parking", "Wheelchair Accessible", "Multilingual Staff"]
    }
  ];

  const atms = [
    { location: "Starbucks - 5th Ave", address: "234 Fifth Avenue", distance: "0.2 miles", features: ["24/7", "Deposit"] },
    { location: "CVS Pharmacy", address: "567 Broadway", distance: "0.4 miles", features: ["24/7"] },
    { location: "Penn Station", address: "1 Pennsylvania Plaza", distance: "0.8 miles", features: ["24/7", "Multiple ATMs"] }
  ];

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
                {branches.map((branch, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold wb-dark mb-1">{branch.name}</h3>
                          <div className="flex items-center text-wb-text mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {branch.address}
                          </div>
                          <div className="flex items-center text-wb-text mb-2">
                            <Phone className="w-4 h-4 mr-1" />
                            {branch.phone}
                          </div>
                          <div className="flex items-center text-wb-text">
                            <Clock className="w-4 h-4 mr-1" />
                            {branch.hours}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-wb-blue font-semibold mb-2">{branch.distance}</div>
                          <Button size="sm">Get Directions</Button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium wb-dark mb-2">Services</div>
                        <div className="flex flex-wrap gap-1">
                          {branch.services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium wb-dark mb-2">Amenities</div>
                        <div className="flex flex-wrap gap-1">
                          {branch.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ATM Locations */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold wb-dark mb-6">Nearby ATMs</h2>
              <div className="space-y-3">
                {atms.map((atm, index) => (
                  <Card key={index} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium wb-dark">{atm.location}</div>
                          <div className="text-sm text-wb-text">{atm.address}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-wb-blue font-semibold text-sm mb-1">{atm.distance}</div>
                          <div className="flex gap-1">
                            {atm.features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
