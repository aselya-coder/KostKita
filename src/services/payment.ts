import { supabase } from "@/lib/supabase";

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  quota: number;
  is_active: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  pricing_plan_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  payment_provider: string;
  external_id?: string;
};

export type UserAccess = {
  user_id: string;
  quota: number;
  used: number;
};

export type EligibilityResult = {
  eligible: boolean;
  message: string;
  is_free: boolean;
};

// ==========================================
// 1. QUOTA & ELIGIBILITY
// ==========================================

/**
 * Check if a user is eligible to upload content.
 * Follows the GLOBAL RULE: 1 free upload, then paid.
 */
export const checkUploadEligibility = async (userId: string): Promise<EligibilityResult> => {
  const { data, error } = await supabase.rpc('check_upload_eligibility', { 
    p_user_id: userId 
  });

  if (error) {
    console.error('Error checking eligibility:', error);
    return { eligible: false, message: 'Gagal memverifikasi kuota upload.', is_free: false };
  }

  return data as EligibilityResult;
};

/**
 * Log an upload and increment usage if not free.
 */
export const recordUpload = async (userId: string, contentType: 'kos' | 'item', contentId: string) => {
  const { eligible, is_free } = await checkUploadEligibility(userId);

  if (!eligible) throw new Error('Kuota upload tidak mencukupi.');

  // 1. Log the upload
  const { error: logError } = await supabase
    .from('uploads')
    .insert({
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      is_free_upload: is_free
    });

  if (logError) throw logError;

  // 2. Increment 'used' in user_access if it's a paid upload
  if (!is_free) {
    const { error: updateError } = await supabase.rpc('increment_used_quota', {
      p_user_id: userId
    });
    if (updateError) throw updateError;
  }
};

// ==========================================
// 2. PRICING & TRANSACTIONS
// ==========================================

export const getPricingPlans = async (): Promise<PricingPlan[]> => {
  const { data, error } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
};

/**
 * Create a pending transaction for a pricing plan.
 * This is called before sending user to Payment Gateway.
 */
export const createPaymentRequest = async (userId: string, planId: string, provider: string) => {
  const plan = (await supabase.from('pricing_plans').select('*').eq('id', planId).single()).data;
  
  if (!plan) throw new Error('Paket tidak ditemukan.');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      pricing_plan_id: planId,
      amount: plan.price,
      payment_provider: provider,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

// ==========================================
// 3. ADMIN MANAGEMENT
// ==========================================

export const getAllTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      profiles(name, email),
      pricing_plans(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updatePricingPlan = async (id: string, updates: Partial<PricingPlan>) => {
  const { data, error } = await supabase
    .from('pricing_plans')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  return data;
};
