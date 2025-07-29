import React from "react";
import { Routes, Route } from "react-router-dom";
import { Search, Upload, BarChart3, FileText, Settings } from "lucide-react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import UploadPage from "./pages/UploadPage";
import DocumentsPage from "./pages/DocumentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DocumentViewPage from "./pages/DocumentViewPage";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Search", href: "/search", icon: Search },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar navigation={navigation} />
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:id" element={<DocumentViewPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
