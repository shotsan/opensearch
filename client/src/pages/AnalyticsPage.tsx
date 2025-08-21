import React from "react";
import { useQuery } from "react-query";
import { FileText, Search, Clock } from "lucide-react";
import { getSearchAnalytics } from "../services/api";

const AnalyticsPage: React.FC = () => {
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  }: {
    data: any;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  } = useQuery("analytics", () => getSearchAnalytics());

  const stats = [
    {
      name: "Total Documents",
      value: analyticsData?.analytics?.totalDocuments ?? "N/A",
      icon: FileText,
    },
    {
      name: "Total Searches",
      value: analyticsData?.analytics?.totalSearches ?? "N/A",
      icon: Search,
    },
    {
      name: "Avg Search Time",
      value:
        analyticsData?.analytics?.recentActivity?.averageSearchTime !==
        undefined
          ? `${analyticsData.analytics.recentActivity.averageSearchTime}ms`
          : "N/A",
      icon: Clock,
    },
  ];

  const fileTypeData = analyticsData?.analytics?.fileTypeDistribution || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search performance and document insights
        </p>
        <button onClick={() => refetch()} className="btn btn-primary mt-4">
          Refresh Analytics
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Searches */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Popular Searches
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {analyticsData?.analytics?.popularQueries?.map(
                (query: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {query.query}
                        </p>
                        <p className="text-xs text-gray-500">
                          {query.count} searches
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(query.count / Math.max(...analyticsData.analytics.popularQueries.map((q: any) => q.count))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(
                          (query.count /
                            Math.max(
                              ...analyticsData.analytics.popularQueries.map(
                                (q: any) => q.count,
                              ),
                            )) *
                            100,
                        )}
                        % of top searches
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              File Type Distribution
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-6">
              {fileTypeData.map((type: any, index: number) => {
                // Color scheme for different file types
                const getFileTypeColors = (fileType: string) => {
                  switch (fileType) {
                    case 'application/pdf':
                      return {
                        bg: 'bg-red-50',
                        border: 'border-red-200',
                        text: 'text-red-700',
                        progress: 'bg-gradient-to-r from-red-500 to-red-600',
                        icon: 'text-red-600'
                      };
                    case 'text/plain':
                      return {
                        bg: 'bg-blue-50',
                        border: 'border-blue-200',
                        text: 'text-blue-700',
                        progress: 'bg-gradient-to-r from-blue-500 to-blue-600',
                        icon: 'text-blue-600'
                      };
                    case 'text/html':
                      return {
                        bg: 'bg-orange-50',
                        border: 'border-orange-200',
                        text: 'text-orange-700',
                        progress: 'bg-gradient-to-r from-orange-500 to-orange-600',
                        icon: 'text-orange-600'
                      };
                    default:
                      return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                        text: 'text-gray-700',
                        progress: 'bg-gradient-to-r from-gray-500 to-gray-600',
                        icon: 'text-gray-600'
                      };
                  }
                };

                const colors = getFileTypeColors(type.type);
                const getFileTypeLabel = (fileType: string) => {
                  switch (fileType) {
                    case 'application/pdf': return 'PDF';
                    case 'text/plain': return 'Text';
                    case 'text/html': return 'HTML';
                    default: return fileType.split('/')[1]?.toUpperCase() || fileType;
                  }
                };

                return (
                  <div
                    key={type.type}
                    className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                          <FileText className={`h-5 w-5 ${colors.icon}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${colors.text}`}>
                            {getFileTypeLabel(type.type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type.count} document{type.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${colors.text}`}>
                          {type.percentage}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${colors.progress} transition-all duration-500 ease-out`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">
                {analyticsData?.analytics?.recentActivity?.documentsUploaded ??
                  "N/A"}
              </h4>
              <p className="text-sm text-gray-500">Documents Uploaded</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">
                {analyticsData?.analytics?.recentActivity?.searchesPerformed ??
                  "N/A"}
              </h4>
              <p className="text-sm text-gray-500">Searches Performed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">
                {analyticsData?.analytics?.recentActivity?.averageSearchTime !==
                undefined && analyticsData.analytics.recentActivity.averageSearchTime !== null
                  ? `${analyticsData.analytics.recentActivity.averageSearchTime}ms`
                  : "No data"}
              </h4>
              <p className="text-sm text-gray-500">Average Search Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
