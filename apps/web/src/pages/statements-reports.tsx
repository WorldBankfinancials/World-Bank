import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/queryClient";
import { FileText, Download, Calendar } from "lucide-react";

interface Statement {
  id: number;
  period: string;
  type: string;
  status: string;
  created_at: string;
}

export default function StatementsReports() {
  const { t } = useLanguage();
  const { userProfile } = useAuth();

  const { data: statements = [] } = useQuery<Statement[]>({
    queryKey: ['/api/statements'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/statements');
      if (!response.ok) return [];
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile as User | undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('statements')}</h1>

        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t('download_reports')}</h2>
          </div>
          <div className="p-4">
            {statements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No statements available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statements.map((stmt: Statement) => (
                  <div key={stmt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{stmt.period}</p>
                        <p className="text-sm text-gray-500">{stmt.type} - {stmt.status}</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/api/transactions/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Transactions (CSV)
          </a>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
