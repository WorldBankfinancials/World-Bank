import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import type { User } from "@shared/schema";

export default function InvestmentPortfolio() {
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

  const holdings = [
    { symbol: "AAPL", name: "Apple Inc.", shares: 150, price: 185.32, change: 2.45, changePercent: 1.34 },
    { symbol: "MSFT", name: "Microsoft Corporation", shares: 200, price: 378.91, change: -3.21, changePercent: -0.84 },
    { symbol: "GOOGL", name: "Alphabet Inc.", shares: 75, price: 142.67, change: 1.89, changePercent: 1.34 },
    { symbol: "AMZN", name: "Amazon.com Inc.", shares: 100, price: 156.78, change: -2.34, changePercent: -1.47 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.shares * holding.price), 0);

  return (
    <div className="min-h-screen bg-wb-gray">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold wb-dark">Investment Portfolio</h1>
          <p className="text-wb-text mt-2">Track your investment performance and holdings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold wb-dark">{formatCurrency(totalValue)}</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm">+8.45% YTD</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Today's Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">+$2,847.32</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm">+0.67%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-wb-text">Cash Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold wb-dark">$12,450.00</div>
              <p className="text-sm text-wb-text mt-2">Ready to invest</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Current Holdings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings.map((holding) => (
                <div key={holding.symbol} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-wb-blue-light rounded-full flex items-center justify-center">
                      <span className="font-bold wb-blue">{holding.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold wb-dark">{holding.symbol}</p>
                      <p className="text-sm text-wb-text">{holding.name}</p>
                      <p className="text-sm text-wb-text">{holding.shares} shares</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold wb-dark">{formatCurrency(holding.price)}</p>
                    <div className={`flex items-center ${holding.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.change >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm">
                        {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)} ({holding.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <p className="text-sm text-wb-text">
                      Value: {formatCurrency(holding.shares * holding.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}