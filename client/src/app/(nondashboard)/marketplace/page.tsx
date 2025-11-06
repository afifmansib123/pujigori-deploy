"use client";

import { useState, useEffect, useCallback } from "react";
import { useGetProjectsQuery } from "@/state/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Search, Heart, Clock, TrendingUp, Filter, X } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "arts", label: "Arts & Culture" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "environment", label: "Environment" },
  { value: "community", label: "Community" },
  { value: "business", label: "Business" },
  { value: "charity", label: "Charity" },
];

const DIVISIONS = [
  { value: "all", label: "All Divisions" },
  { value: "Dhaka", label: "Dhaka" },
  { value: "Chittagong", label: "Chittagong" },
  { value: "Rajshahi", label: "Rajshahi" },
  { value: "Khulna", label: "Khulna" },
  { value: "Barisal", label: "Barisal" },
  { value: "Sylhet", label: "Sylhet" },
  { value: "Rangpur", label: "Rangpur" },
  { value: "Mymensingh", label: "Mymensingh" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "currentAmount-desc", label: "Most Funded" },
  { value: "backerCount-desc", label: "Most Popular" },
  { value: "endDate-asc", label: "Ending Soon" },
];

export default function PublicProjectsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [sortOption, setSortOption] = useState("createdAt-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Parse sort option
  const [sortBy, sortOrder] = sortOption.split("-");

  const { data: projectsData, isLoading } = useGetProjectsQuery({
    page: currentPage,
    limit: 12,
    status: "active",
    category: categoryFilter === "all" ? undefined : categoryFilter,
    division: divisionFilter === "all" ? undefined : divisionFilter,
    search: debouncedSearch || undefined,
    sort: sortBy,
    sortOrder: sortOrder,
  });

  // Fetch suggestions for autocomplete
  const { data: suggestionsData } = useGetProjectsQuery(
    {
      page: 1,
      limit: 5,
      status: "active",
      search: searchTerm || undefined,
    },
    {
      skip: !searchTerm || searchTerm.length < 2,
    }
  );

  useEffect(() => {
    if (suggestionsData?.data && searchTerm.length >= 2) {
      setSuggestions(suggestionsData.data);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [suggestionsData, searchTerm]);

  const projects = projectsData?.data || [];
  const meta = projectsData?.meta;

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setDivisionFilter("all");
    setSortOption("createdAt-desc");
    setCurrentPage(1);
  };

  const handleSuggestionClick = (project: any) => {
    setSearchTerm(project.title);
    setShowSuggestions(false);
  };

  const activeFiltersCount = [
    categoryFilter !== "all",
    divisionFilter !== "all",
    sortOption !== "createdAt-desc",
    debouncedSearch,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Projects
            </h1>
            <p className="text-xl text-green-50 mb-8">
              Support innovative ideas and make a difference in Bangladesh
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search projects by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  className="pl-12 pr-4 py-6 text-lg bg-white text-gray-900 border-0 shadow-lg rounded-xl"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {suggestions.map((project) => (
                      <div
                        key={project._id}
                        onClick={() => handleSuggestionClick(project)}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {project.images?.[0] ? (
                            <img
                              src={project.images[0]}
                              alt={project.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                              {project.title.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {project.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {project.shortDescription}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                {project.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                BDT {project.currentAmount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Division Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Location
              </label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((div) => (
                    <SelectItem key={div.value} value={div.value}>
                      {div.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sort By
              </label>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full lg:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear ({activeFiltersCount})
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing <span className="font-semibold">{projects.length}</span> of{" "}
                  <span className="font-semibold">{meta?.total || 0}</span> active
                  projects
                </>
              )}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 bg-white rounded-xl animate-pulse border shadow-sm"
              />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => {
                const fundingProgress = project.targetAmount
                  ? (project.currentAmount / project.targetAmount) * 100
                  : 0;
                const daysRemaining = calculateDaysRemaining(project.endDate);

                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                  >
                    <Link href={`/projects/${project.slug}`}>
                      <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500 overflow-hidden cursor-pointer">
                        {project.images?.[0] ? (
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold opacity-20">
                            {project.title.charAt(0)}
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                            {project.category}
                          </span>
                        </div>
                        {project.location?.division && (
                          <div className="absolute top-3 right-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600/90 text-white backdrop-blur-sm">
                              {project.location.division}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-5 space-y-4">
                      <Link href={`/projects/${project.slug}`}>
                        <div className="cursor-pointer">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.shortDescription}
                          </p>
                        </div>
                      </Link>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-green-600">
                            BDT {project.currentAmount?.toLocaleString() || 0}
                          </span>
                          <span className="text-muted-foreground">
                            of {project.targetAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(fundingProgress, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 text-right">
                          {fundingProgress.toFixed(1)}% funded
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{project.backerCount || 0} backers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{daysRemaining} days left</span>
                        </div>
                      </div>

                      <Link href={`/projects/${project.slug}`}>
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {[...Array(Math.min(meta.totalPages, 5))].map((_, idx) => {
                    const pageNum = currentPage <= 3 
                      ? idx + 1 
                      : currentPage >= meta.totalPages - 2
                      ? meta.totalPages - 4 + idx
                      : currentPage - 2 + idx;
                    
                    if (pageNum < 1 || pageNum > meta.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={currentPage === pageNum ? "bg-green-600" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={handleClearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}