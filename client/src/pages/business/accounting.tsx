
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileJson, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/queryClient";
import Header from "@/components/Header";

export default function AccountingDashboard() {
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json', software: 'quickbooks' | 'xero') => {
    try {
      const response = await authenticatedFetch(`/api/business/accounting-export?format=${format}&software=${software}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting_export_${software}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Your ${software.toUpperCase()} export is ready.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate accounting export. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Accounting Integration</h1>
            <p className="text-slate-600">Export your financial data to popular accounting software.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src="https://quickbooks.intuit.com/favicon.ico" className="w-5 h-5" alt="" />
                QuickBooks Online
              </CardTitle>
              <CardDescription>
                Sync your transactions, invoices, and expenses with QuickBooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleExport('csv', 'quickbooks')} variant="outline" className="justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download CSV for QuickBooks
                </Button>
                <Button onClick={() => handleExport('json', 'quickbooks')} variant="outline" className="justify-start">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download IIF/JSON for QuickBooks
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src="https://www.xero.com/favicon.ico" className="w-5 h-5" alt="" />
                Xero Accounting
              </CardTitle>
              <CardDescription>
                Seamlessly import your bank statements and reconciled transactions into Xero.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleExport('csv', 'xero')} variant="outline" className="justify-start">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Xero Bank Statement (CSV)
                </Button>
                <Button onClick={() => handleExport('json', 'xero')} variant="outline" className="justify-start">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download Xero API-ready JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
