"use client";

import { useState } from "react";
import { useGetProjectsQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { Heart, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  {
    value: "charity",
    label: "Charity",
    icon: "🤲",
    color: "from-pink-500 to-rose-500",
    description: "Help others by donating to charitable causes",
  },
  {
    value: "technology",
    label: "Technology",
    icon: "🔧",
    color: "from-blue-500 to-cyan-500",
    description: "Innovative tech startups and digital solutions",
  },
  {
    value: "health",
    label: "Health",
    icon: "❤️",
    color: "from-red-500 to-pink-500",
    description: "Healthcare and wellness initiatives",
  },
  {
    value: "agriculture",
    label: "Agriculture",
    icon: "🚜",
    color: "from-green-500 to-emerald-500",
    description: "Sustainable farming and agri-tech",
  },
  {
    value: "education",
    label: "Education",
    icon: "📚",
    color: "from-purple-500 to-indigo-500",
    description: "Educational programs and learning platforms",
  },
  {
    value: "environment",
    label: "Environment",
    icon: "🌍",
    color: "from-green-600 to-teal-500",
    description: "Environmental conservation projects",
  },
  {
    value: "community",
    label: "Community",
    icon: "🏘️",
    color: "from-orange-500 to-amber-500",
    description: "Community development initiatives",
  },
  {
    value: "business",
    label: "Business",
    icon: "💼",
    color: "from-gray-600 to-slate-500",
    description: "Business startups and entrepreneurship",
  },
];

const CategorySection = ({ category }: { category: any }) => {
  const { data: projectsData, isLoading } = useGetProjectsQuery({
    page: 1,
    limit: 6,
    status: "active",
    category: category.value,
  });

  const projects = projectsData?.data || [];

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="mb-16">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{category.icon}</div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{category.label} Startups</h2>
            <p className="text-gray-600 mt-1">{category.description}</p>
          </div>
        </div>
        <Link href={`/categories/${category.value}`}>
          <Button variant="outline" className="gap-2">
            View Details
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Projects Carousel */}
      <Carousel className="w-full">
        <CarouselContent className="-ml-4">
          {projects.map((project: any) => {
            const fundingProgress = project.targetAmount
              ? (project.currentAmount / project.targetAmount) * 100
              : 0;
            const daysRemaining = calculateDaysRemaining(project.endDate);

            return (
              <CarouselItem key={project._id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="bg-white rounded-xl border overflow-hidden hover:shadow-2xl transition-all duration-300 group h-full">
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
                          className={`w-full h-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white text-6xl font-bold opacity-20`}
                        >
                          {project.title.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                          {project.category}
                        </span>
                      </div>
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
                          className={`bg-gradient-to-r ${category.color} h-2 rounded-full transition-all duration-500`}
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
                        className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white border-0`}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0 bg-white/90 backdrop-blur-sm" />
        <CarouselNext className="right-0 bg-white/90 backdrop-blur-sm" />
      </Carousel>
    </motion.div>
  );
};

export default function CategoryProjectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Browse fundraisers
                <br />
                <span className="text-green-600">by category</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                People around the world are raising money for what they are passionate about.
              </p>
              <Link href="/projects">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  DONATE
                </Button>
              </Link>
            </motion.div>

            {/* Right - Category Grid */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {CATEGORIES.map((category, index) => (
                <motion.div
                  key={category.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Link href={`/categories/${category.value}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100">
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {category.label}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Discover Section Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 italic mb-4">
            Discover start-up inspired by what you care about
          </h2>
          <div className="w-24 h-1 bg-green-600 mx-auto"></div>
        </motion.div>

        {/* Category Sections */}
        <div className="space-y-16">
          {CATEGORIES.map((category) => (
            <CategorySection key={category.value} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}