"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { 
  useGetAuthUserQuery, 
  useCreateProjectMutation, 
  useUploadMultipleFilesMutation 
} from "@/state/api";
import { projectFormSchema, ProjectFormData } from "@/lib/validations/project";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  X, 
  Upload, 
  Eye, 
  Loader2,
  AlertCircle,
  Trash2
} from "lucide-react";

// FilePond imports
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

// Bangladesh divisions and districts
const BANGLADESH_LOCATIONS = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Kishoreganj", "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Faridpur", "Gopalganj", "Madaripur", "Shariatpur"],
  Chittagong: ["Chittagong", "Cox's Bazar", "Rangamati", "Bandarban", "Khagrachhari", "Feni", "Lakshmipur", "Comilla", "Noakhali", "Brahmanbaria", "Chandpur"],
  Rajshahi: ["Rajshahi", "Bogra", "Pabna", "Sirajganj", "Natore", "Naogaon", "Chapainawabganj", "Joypurhat"],
  Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Chuadanga", "Kushtia", "Magura", "Meherpur", "Narail", "Jhenaidah"],
  Barisal: ["Barisal", "Patuakhali", "Bhola", "Pirojpur", "Jhalokati", "Barguna"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

const CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "environment", label: "Environment" },
  { value: "technology", label: "Technology" },
  { value: "arts", label: "Arts & Culture" },
  { value: "community", label: "Community" },
  { value: "business", label: "Business" },
  { value: "charity", label: "Charity" },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { data: authUser } = useGetAuthUserQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [uploadImages] = useUploadMultipleFilesMutation();

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<ProjectFormData>({
    resolver : zodResolver(projectFormSchema) as any,
    defaultValues: {
      title: "",
      shortDescription: "",
      description: "",
      category: undefined,
      targetAmount: 0,
      startDate: "",
      endDate: "",
      location: {
        district: "",
        division: "",
      },
      story: "",
      risks: "",
      images: [],
      videoUrl: "",
      rewardTiers: [
        {
          title: "",
          description: "",
          minimumAmount: 0,
          maxBackers: undefined,
          estimatedDelivery: "",
          items: [""],
          isActive: true,
        },
      ],
      tags: [],
      termsAgreed: false,
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;

  const watchedImages = watch("images");
  const watchedRewardTiers = watch("rewardTiers");
  const watchedDivision = watch("location.division");

  // Update districts when division changes
  React.useEffect(() => {
    if (watchedDivision && watchedDivision !== selectedDivision) {
      setSelectedDivision(watchedDivision);
      setValue("location.district", "");
    }
  }, [watchedDivision, selectedDivision, setValue]);

  // Add reward tier
  const addRewardTier = () => {
    const currentTiers = form.getValues("rewardTiers");
    form.setValue("rewardTiers", [
      ...currentTiers,
      {
        title: "",
        description: "",
        minimumAmount: 0,
        maxBackers: undefined,
        estimatedDelivery: "",
        items: [""],
        isActive: true,
      },
    ]);
  };

  // Remove reward tier
  const removeRewardTier = (index: number) => {
    const currentTiers = form.getValues("rewardTiers");
    if (currentTiers.length > 1) {
      form.setValue(
        "rewardTiers",
        currentTiers.filter((_, i) => i !== index)
      );
    }
  };

  // Add item to reward tier
  const addRewardItem = (tierIndex: number) => {
    const currentTiers = form.getValues("rewardTiers");
    const updatedTiers = [...currentTiers];
    updatedTiers[tierIndex].items.push("");
    form.setValue("rewardTiers", updatedTiers);
  };

  // Remove item from reward tier
  const removeRewardItem = (tierIndex: number, itemIndex: number) => {
    const currentTiers = form.getValues("rewardTiers");
    const updatedTiers = [...currentTiers];
    if (updatedTiers[tierIndex].items.length > 1) {
      updatedTiers[tierIndex].items = updatedTiers[tierIndex].items.filter(
        (_, i) => i !== itemIndex
      );
      form.setValue("rewardTiers", updatedTiers);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    setSubmitMessage(null);

    try {
      // Step 1: Upload images to S3
      let uploadedImageUrls: string[] = [];
      
      if (data.images && data.images.length > 0) {
        const uploadResult = await uploadImages({
          files: data.images,
          folder: "projects",
          resize: "1200x800",
          quality: 85,
        }).unwrap();

        uploadedImageUrls = uploadResult.files?.map((file: any) => file.url) || [];
      }

      // Step 2: Create project with uploaded image URLs
      const projectData = {
        ...data,
        images: uploadedImageUrls,
        status: "active", 
      };

      const result = await createProject(projectData).unwrap();

      setSubmitMessage({
        type: "success",
        text: "Project created successfully! Redirecting...",
      });

      // Redirect to project page after 2 seconds
      setTimeout(() => {
        router.push(`/creator/dashboard`);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to create project:", error);
      setSubmitMessage({
        type: "error",
        text: error?.data?.message || "Failed to create project. Please try again.",
      });
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation failed:", errors);
    const errorFields = Object.keys(errors)
      .map((key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"))
      .join(", ");
    setSubmitMessage({
      type: "error",
      text: `Please fix the following errors: ${errorFields}`,
    });
  };

  const sectionCardClassName = "bg-white rounded-lg border p-6 space-y-6";
  const sectionTitleClassName = "text-xl font-semibold text-gray-900";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center justify-between flex-1">
          <h1 className="text-xl font-semibold">Create New Project</h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {isPreviewMode ? "Edit Mode" : "Preview"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {submitMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 max-w-4xl mx-auto ${
              submitMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{submitMessage.text}</span>
          </div>
        )}

        {isPreviewMode ? (
          // Preview Mode
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border p-8">
              <h2 className="text-3xl font-bold mb-4">{watch("title") || "Project Title"}</h2>
              <p className="text-lg text-muted-foreground mb-6">
                {watch("shortDescription") || "Short description will appear here..."}
              </p>
              
              {watchedImages.length > 0 && (
                <div className="mb-6">
                  <img
                    src={URL.createObjectURL(watchedImages[0])}
                    alt="Project preview"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Target Amount</p>
                  <p className="text-2xl font-bold text-green-600">৳{watch("targetAmount")?.toLocaleString() || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold capitalize">{watch("category") || "N/A"}</p>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-2">Description</h3>
                <p className="whitespace-pre-wrap">
                  {watch("description") || "Full description will appear here..."}
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-2">Project Story</h3>
                <p className="whitespace-pre-wrap">
                  {watch("story") || "Project story will appear here..."}
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-2">Risks & Challenges</h3>
                <p className="whitespace-pre-wrap">
                  {watch("risks") || "Risks and challenges will appear here..."}
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-2">Reward Tiers</h3>
                <div className="space-y-4 not-prose">
                  {watchedRewardTiers.map((tier, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg">{tier.title || `Tier ${index + 1}`}</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        {tier.description || "Description..."}
                      </p>
                      <p className="text-2xl font-bold text-green-600 mt-3">
                        ৳{tier.minimumAmount || 0}+
                      </p>
                      {tier.items && tier.items.length > 0 && tier.items[0] && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Includes:</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {tier.items.map((item, i) => item && <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode - Form
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit as any, onInvalid)} className="max-w-4xl mx-auto space-y-8">
              
              {/* Basic Information */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Basic Information</h2>
                
                <FormField
                  control={control as any}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Smart Water Purifier for Rural Bangladesh"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, compelling title (5-100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary for project listings"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Concise summary (20-200 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of your project..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comprehensive project description (minimum 50 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Funding & Timeline */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Funding & Timeline</h2>
                
                <FormField
                  control={control as any}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount (BDT) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 50000"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 1,000 BDT, Maximum 10,000,000 BDT
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control as any}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control as any}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Location</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control as any}
                    name="location.division"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Division *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(BANGLADESH_LOCATIONS).map((division) => (
                              <SelectItem key={division} value={division}>
                                {division}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control as any}
                    name="location.district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedDivision}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDivision && 
                              BANGLADESH_LOCATIONS[selectedDivision as keyof typeof BANGLADESH_LOCATIONS]?.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Project Story & Risks */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Project Story & Risks</h2>
                
                <FormField
                  control={control as any}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Story *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the story of your project..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Share your vision, goals, and impact (minimum 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="risks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risks & Challenges *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe potential risks and how you'll address them..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be transparent about challenges (minimum 50 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Media */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Project Media</h2>
                
                <FormField
                  control={control as any}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Images *</FormLabel>
                      <FormControl>
                        <FilePond
                          files={field.value as File[]}
                          onupdatefiles={(fileItems) =>
                            field.onChange(fileItems.map((item) => item.file as File))
                          }
                          allowMultiple={true}
                          maxFiles={10}
                          name="images"
                          labelIdle='Drag & Drop images or <span class="filepond--label-action">Browse</span>'
                          allowImagePreview={true}
                          imagePreviewHeight={200}
                          acceptedFileTypes={["image/png", "image/jpeg", "image/jpg", "image/webp"]}
                          allowFileSizeValidation={true}
                          maxFileSize="5MB"
                          credits={false}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload 1-10 images (PNG, JPG, WebP - max 5MB each)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        YouTube or Vimeo video URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reward Tiers */}
              <div className={sectionCardClassName}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={sectionTitleClassName}>Reward Tiers</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRewardTier}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-6">
                  {watchedRewardTiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="border rounded-lg p-4 bg-gray-50 relative">
                      {watchedRewardTiers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRewardTier(tierIndex)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <h3 className="font-semibold mb-4">Tier {tierIndex + 1}</h3>

                      <div className="space-y-4">
                        <FormField
                          control={control as any}
                          name={`rewardTiers.${tierIndex}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tier Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Early Bird Supporter" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control as any}
                          name={`rewardTiers.${tierIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe what backers will receive..." 
                                  rows={2}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={control as any}
                            name={`rewardTiers.${tierIndex}.minimumAmount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Amount (BDT) *</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="500" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control as any}
                            name={`rewardTiers.${tierIndex}.maxBackers`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Backers (Optional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Unlimited"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control as any}
                            name={`rewardTiers.${tierIndex}.estimatedDelivery`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Delivery *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Reward Items */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Reward Items *</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRewardItem(tierIndex)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Item
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {tier.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center gap-2">
                                <FormField
                                  control={control as any}
                                  name={`rewardTiers.${tierIndex}.items.${itemIndex}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input placeholder="e.g., Thank you card" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {tier.items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRewardItem(tierIndex, itemIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Tags (Optional)</h2>
                
                <FormField
                  control={control as any}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., sustainability, community, innovation (comma-separated)"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag);
                            field.onChange(tags);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Add up to 10 tags to help people find your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Terms & Conditions */}
              <div className={sectionCardClassName}>
                <h2 className={sectionTitleClassName}>Terms & Conditions</h2>
                
                <FormField
                  control={control as any}
                  name="termsAgreed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I confirm that all information provided is accurate and I agree to the platform terms
                        </FormLabel>
                        <FormDescription>
                          By creating this project, you agree to our terms of service and creator guidelines
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="min-w-[200px]"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Project...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Create Project
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </main>
    </div>
  );
}