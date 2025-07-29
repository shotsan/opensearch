import React from "react";
import { useQuery } from "react-query";
import { FileText, Search, Upload, TrendingUp } from "lucide-react";
import { getDocuments } from "../services/api";

const Dashboard: React.FC = () => {
  const { data: documentsData } = useQuery("documents", () =>
    getDocuments({ page: 1, limit: 5 }),
  );
  const recentDocuments = documentsData?.documents || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome! Here are your most recent documents and quick actions.
        </p>
      </div>

      {/* Recent Documents */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Documents
          </h3>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentDocuments.length === 0 && (
                <li className="py-4 text-gray-500 text-center">
                  No recent documents found.
                </li>
              )}
              {recentDocuments.map((doc: any) => (
                <li key={doc.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.source.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doc.source.filename} • {doc.source.fileType}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-sm text-gray-500">
                      {new Date(doc.source.uploadDate).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <a
              href="/documents"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View all documents
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/upload"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                  <Upload className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Upload Document
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add new documents to your search index
                </p>
              </div>
            </a>

            <a
              href="/search"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <Search className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Search Documents
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Find documents using advanced search
                </p>
              </div>
            </a>

            <a
              href="/analytics"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                  <TrendingUp className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Check search performance and trends
                </p>
              </div>
            </a>

            <a
              href="/documents"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <FileText className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Manage Documents
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage all documents
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
