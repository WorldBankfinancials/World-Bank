import type { User } from "@shared/schema";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download, FileText, Calendar, Filter } from "lucide-react";


export default function StatementsReports() {
  const { t } = useLanguage();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  // Fetch real statements from database
  const { data: statements, isLoading: statementsLoading } = useQuery<any[]>({
    queryKey: ['/api/statements'],
    enabled: !!user,
  });

  if (statementsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading statements...</div>
      </div>
    );
  }

  const statementsList = statements || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statements & Reports</h1>
            <p className="text-gray-600 mt-2">Download your account statements and financial reports</p>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Generate Custom Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filter Statements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Account Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Statement Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="monthly">Monthly Statement</SelectItem>
                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                    <SelectItem value="annual">Annual Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Year</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="2024" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statements List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statementsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No statements available yet</p>
                  <p className="text-sm">Statements are generated monthly</p>
                </div>
              ) : (
                statementsList.map((statement: any, index: number) => (
                  <div key={statement.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50" data-testid={`statement-item-${statement.id}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900" data-testid={`statement-period-${statement.id}`}>{statement.statement_period || statement.statementPeriod}</h3>
                        <p className="text-sm text-gray-600">{statement.statement_type || statement.statementType} • {statement.file_size || statement.fileSize || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Generated on {new Date(statement.generated_at || statement.generatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" data-testid={`statement-view-${statement.id}`}>
                          View
                        </Button>
                        <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" data-testid={`statement-download-${statement.id}`}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Tax Documents</h3>
                  <p className="text-sm text-gray-600">1099, 1098 forms</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Download Tax Forms
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Year-End Summary</h3>
                  <p className="text-sm text-gray-600">Annual overview</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Generate Summary
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Download className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Bulk Download</h3>
                  <p className="text-sm text-gray-600">Multiple statements</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Bulk Download
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
