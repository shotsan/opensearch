import React from "react";
import { Search, Upload, TrendingUp, ArrowRight, FileText } from "lucide-react";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome! Follow the process flow to manage your documents effectively.
        </p>
      </div>

      {/* Process Flow */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Document Management Process
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Upload */}
            <div className="relative">
              <a
                href="/upload"
                className="group block bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <span className="rounded-full inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload className="h-6 w-6" />
                    </span>
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      1
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Upload Documents
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Add PDF, DOCX, TXT, and HTML files to your search index
                </p>
                <div className="flex items-center justify-center text-primary-600 group-hover:text-primary-700 transition-colors">
                  <span className="text-sm font-medium">Get Started</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>

            {/* Step 2: Search */}
            <div className="relative">
              <a
                href="/search"
                className="group block bg-white p-6 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <span className="rounded-full inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-6 w-6" />
                    </span>
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      2
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Search & Find
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Use advanced search with filters to find relevant documents
                </p>
                <div className="flex items-center justify-center text-green-600 group-hover:text-green-700 transition-colors">
                  <span className="text-sm font-medium">Search Now</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>

            {/* Step 3: Analyze */}
            <div className="relative">
              <a
                href="/analytics"
                className="group block bg-white p-6 rounded-lg border border-gray-200 hover:border-yellow-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <span className="rounded-full inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-6 w-6" />
                    </span>
                    <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      3
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Analyze & Insights
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  View search analytics and performance insights
                </p>
                <div className="flex items-center justify-center text-yellow-600 group-hover:text-yellow-700 transition-colors">
                  <span className="text-sm font-medium">View Analytics</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>

          {/* Process Flow Indicator */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                <div className="w-12 h-1 bg-primary-600 mx-2"></div>
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <div className="w-12 h-1 bg-green-600 mx-2"></div>
                <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Follow the process flow for optimal document management
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Documents</p>
              <p className="text-lg font-semibold text-gray-900">Ready to upload</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Search className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Search</p>
              <p className="text-lg font-semibold text-gray-900">Advanced filters</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Analytics</p>
              <p className="text-lg font-semibold text-gray-900">Performance insights</p>
            </div>
          </div>
        </div>
        
        <a href="/documents" className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">View Documents</p>
              <p className="text-lg font-semibold text-gray-900">Browse library</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
