"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { Search, Heart, Clock, TrendingUp, ArrowLeft, Filter } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_INFO: Record<string, any> = {
  charity: {
    label: "Charity",
    icon: "🤲",
    color: "from-pink-500 to-rose-500",
    bgColor: "from-pink-50 to-rose-50",
    description: "Help others by donating to charitable causes and make a difference in people's lives",
    heroImage: "/api/placeholder/800/400",
  },
  technology: {
    label: "Technology",
    icon: "🔧",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
    description: "Support innovative tech startups and digital solutions that shape the future",
    heroImage: "/api/placeholder/800/400",
  },
  health: {
    label: "Health",
    icon: "❤️",
    color: "from-red-500 to-pink-500",
    bgColor: "from-red-50 to-pink-50",
    description: "Back healthcare and wellness initiatives that improve lives",
    heroImage: "/api/placeholder/800/400",
  },
  agriculture: {
    label: "Agriculture",
    icon: "🚜",
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50",
    description: "Support sustainable farming and agri-tech innovations",
    heroImage: "/api/placeholder/800/400",
  },
  education: {
    label: "Education",
    icon: "📚",
    color: "from-purple-500 to-indigo-500",
    bgColor: "from-purple-50 to-indigo-50",
    description: "Fund educational programs and learning platforms that empower minds",
    heroImage: "/api/placeholder/800/400",
  },
  environment: {
    label: "Environment",
    icon: "🌍",
    color: "from-green-600 to-teal-500",
    bgColor: "from-green-50 to-teal-50",
    description: "Protect our planet by supporting environmental conservation projects",
    heroImage: "/api/placeholder/800/400",
  },
  community: {
    label: "Community",
    icon: "🏘️",
    color: "from-orange-500 to-amber-500",
    bgColor: "from-orange-50 to-amber-50",
    description: "Build stronger communities through development initiatives",
    heroImage: "/api/placeholder/800/400",
  },
  business: {
    label: "Business",
    icon: "💼",
    color: "from-gray-600 to-slate-500",
    bgColor: "from-gray-50 to-slate-50",
    description: "Empower entrepreneurs and innovative business startups",
    heroImage: "/api/placeholder/800/400",
  },
};

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "currentAmount-desc", label: "Most Funded" },
  { value: "backerCount-desc", label: "Most Popular" },
  { value: "endDate-asc", label: "Ending Soon" },
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

export default function CategoryDetailPage() {
  const params = useParams();
  const category = params.category as string;
  const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.charity;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [sortOption, setSortOption] = useState("createdAt-desc");

  const [sortBy, sortOrder] = sortOption.split("-");

  const { data: projectsData, isLoading } = useGetProjectsQuery({
    page: currentPage,
    limit: 12,
    status: "active",
    category: category,
    division: divisionFilter === "all" ? undefined : divisionFilter,
    search: searchTerm || undefined,
    sort: sortBy,
    sortOrder: sortOrder,
  });

  const projects = projectsData?.data || [];
  const meta = projectsData?.meta;

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`relative bg-gradient-to-br ${categoryInfo.bgColor} py-20 overflow-hidden`}
      >
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">{categoryInfo.icon}</div>
          <div className="absolute bottom-10 right-10 text-9xl">{categoryInfo.icon}</div>
          <div className="absolute top-1/2 left-1/3 text-7xl opacity-50">{categoryInfo.icon}</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/categories">
            <Button variant="ghost" className="mb-6 gap-2 hover:bg-white/50">
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-7xl">{categoryInfo.icon}</div>
                <div>
                  <h1 className="text-5xl font-bold text-gray-900">
                    Discover {categoryInfo.label}
                    <br />
                    <span className={`bg-gradient-to-r ${categoryInfo.color} bg-clip-text text-transparent`}>
                      Startups on PujiGori
                    </span>
                  </h1>
                </div>
              </div>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {categoryInfo.description}
              </p>
              <Link href="/projects/create">
                <Button
                  size="lg"
                  className={`bg-gradient-to-r ${categoryInfo.color} hover:opacity-90 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all`}
                >
                  DONATE
                </Button>
              </Link>
            </motion.div>

            {/* Right - Hero Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-white p-8">
                <img
                  src={categoryInfo.heroImage}
                  alt={categoryInfo.label}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl border shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${categoryInfo.label.toLowerCase()} projects...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Division Filter */}
            <div className="w-full lg:w-48">
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

            {/* Sort */}
            <div className="w-full lg:w-48">
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
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing <span className="font-semibold">{projects.length}</span> of{" "}
                  <span className="font-semibold">{meta?.total || 0}</span> {categoryInfo.label.toLowerCase()} projects
                </>
              )}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>Active filters: {[divisionFilter !== "all", searchTerm, sortOption !== "createdAt-desc"].filter(Boolean).length}</span>
            </div>
          </div>
        </motion.div>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {projects.map((project: any, index: number) => {
                const fundingProgress = project.targetAmount
                  ? (project.currentAmount / project.targetAmount) * 100
                  : 0;
                const daysRemaining = calculateDaysRemaining(project.endDate);

                return (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                  >
                    <Link href={`/projects/${project.slug}`}>
                      <div className="relative h-48 overflow-hidden cursor-pointer">
                        {project.images?.[0] ? (
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center text-white text-6xl font-bold opacity-20`}
                          >
                            {project.title.charAt(0)}
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                            {categoryInfo.label}
                          </span>
                        </div>
                        {project.location?.division && (
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryInfo.color} text-white backdrop-blur-sm`}>
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
                            className={`bg-gradient-to-r ${categoryInfo.color} h-2 rounded-full transition-all duration-500`}
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
                        <Button
                          className={`w-full bg-gradient-to-r ${categoryInfo.color} hover:opacity-90 text-white border-0`}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

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
                    const pageNum =
                      currentPage <= 3
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
                        className={
                          currentPage === pageNum
                            ? `bg-gradient-to-r ${categoryInfo.color} text-white border-0`
                            : ""
                        }
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
            <div className="text-8xl mb-4 opacity-20">{categoryInfo.icon}</div>
            <h3 className="text-xl font-semibold mb-2">
              No {categoryInfo.label.toLowerCase()} projects found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setDivisionFilter("all");
                setSortOption("createdAt-desc");
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}