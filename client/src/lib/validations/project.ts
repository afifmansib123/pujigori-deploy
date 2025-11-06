import * as z from "zod";

export const projectFormSchema = z.object({
  title: z.string().min(5).max(100),
  shortDescription: z.string().min(20).max(200),
  description: z.string().min(50),
  category: z.string(),
  targetAmount: z.coerce.number().min(1000).max(10000000),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  location: z.object({
    district: z.string().min(1),
    division: z.string().min(1),
  }),
  story: z.string().min(100),
  risks: z.string().min(50),
  images: z.array(z.any()).min(1).max(10),
  videoUrl: z.string().optional(),
  rewardTiers: z.array(z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    minimumAmount: z.coerce.number().min(10), 
    maxBackers: z.coerce.number().optional(),
    estimatedDelivery: z.string().min(1),
    items: z.array(z.string()).min(1),
    isActive: z.boolean(),
  })).min(1).max(10),
  tags: z.array(z.string()).optional(),
  termsAgreed: z.boolean(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;