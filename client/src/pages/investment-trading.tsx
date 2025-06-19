
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Globe,
  Shield,
  Zap,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import type { User } from "@shared/schema";

export default function InvestmentTrading() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const marketIndices = [
    { name: "S&P 500", value: "4,789.45", change: "+1.2%", trend: "up" },
    { name: "NASDAQ", value: "15,234.87", change: "+0.8%", trend: "up" },
    { name: "DOW JONES", value: "37,845.12", change: "-0.3%", trend: "down" },
    { name: "FTSE 100", value: "7,654.23", change: "+0.5%", trend: "up" }
  ];

  const topStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: "$195.42", change: "+2.1%", trend: "up" },
    { symbol: "MSFT", name: "Microsoft", price: "$378.85", change: "+1.8%", trend: "up" },
    { symbol: "GOOGL", name: "Alphabet", price: "$142.65", change: "-0.7%", trend: "down" },
    { symbol: "AMZN", name: "Amazon", price: "$151.94", change: "+1.4%", trend: "up" },
    { symbol: "TSLA", name: "Tesla", price: "$248.48", change: "+3.2%", trend: "up" },
    { symbol: "NVDA", name: "NVIDIA", price: "$495.22", change: "+2.9%", trend: "up" }
  ];

  const portfolioAssets = [
    { name: "US Equities", value: "$25,847,392", allocation: "54%", change: "+8.2%" },
    { name: "International Equities", value: "$12,384,156", allocation: "26%", change: "+6.7%" },
    { name: "Fixed Income", value: "$7,245,891", allocation: "15%", change: "+2.1%" },
    { name: "Commodities", value: "$2,355,756", allocation: "5%", change: "+12.4%" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment & Trading</h1>
            <p className="text-gray-600 mt-2">Professional investment platform for global markets</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Market Research
            </Button>
            <Button className="bg-blue-600 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">$47,832,195</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    +8.45% YTD
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Day's Gain/Loss</p>
                  <p className="text-2xl font-bold text-green-600">+$127,845</p>
                  <p className="text-sm text-green-600">+2.67%</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cash Available</p>
                  <p className="text-2xl font-bold text-gray-900">$2,847,392</p>
                  <p className="text-sm text-gray-600">For trading</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Positions</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                  <p className="text-sm text-gray-600">Holdings</p>
                </div>
                <PieChart className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Indices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Global Market Indices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {marketIndices.map((index, i) => (
                    <div key={i} className="text-center p-4 border rounded-lg">
                      <div className="font-semibold text-gray-900">{index.name}</div>
                      <div className="text-lg font-bold mt-1">{index.value}</div>
                      <div className={`text-sm flex items-center justify-center mt-1 ${
                        index.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {index.trend === 'up' ? 
                          <ArrowUpRight className="w-3 h-3 mr-1" /> : 
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                        }
                        {index.change}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Stocks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Top Performing Stocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topStocks.map((stock, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{stock.symbol}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{stock.price}</div>
                        <div className={`text-sm flex items-center ${
                          stock.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.trend === 'up' ? 
                            <ArrowUpRight className="w-3 h-3 mr-1" /> : 
                            <ArrowDownRight className="w-3 h-3 mr-1" />
                          }
                          {stock.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioAssets.map((asset, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                        <div>
                          <div className="font-medium text-gray-900">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.allocation} of portfolio</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{asset.value}</div>
                        <div className="text-sm text-green-600">{asset.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Trade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Trade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-green-600 text-white hover:bg-green-700">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Buy
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Sell
                  </Button>
                </div>
                <div className="text-center text-sm text-gray-500">
                  Access to 50+ global markets
                </div>
              </CardContent>
            </Card>

            {/* Trading Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Trading Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Technical Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Risk Calculator
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Economic Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Market News */}
            <Card>
              <CardHeader>
                <CardTitle>Market News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">Fed Holds Interest Rates Steady</div>
                  <div className="text-gray-500">Markets rally on dovish comments...</div>
                  <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">Tech Earnings Beat Expectations</div>
                  <div className="text-gray-500">Strong quarterly results drive growth...</div>
                  <div className="text-xs text-gray-400 mt-1">4 hours ago</div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View All News
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
