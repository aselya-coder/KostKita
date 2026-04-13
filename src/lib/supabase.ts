import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const normalizeEnv = (value?: string) => {
  if (!value) return value;
  const trimmed = value.trim();
  const isWrappedWithDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const isWrappedWithSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  if (isWrappedWithDoubleQuotes || isWrappedWithSingleQuotes) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Missing Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Please set them in your .env file.';

const supabaseSingletonKey = '__kostkita_supabase_client__';
const getCachedSupabase = () => (globalThis as any)[supabaseSingletonKey] as SupabaseClient | undefined;
const setCachedSupabase = (client: SupabaseClient) => ((globalThis as any)[supabaseSingletonKey] = client);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? (getCachedSupabase() ??
      setCachedSupabase(
        createClient(supabaseUrl!, supabaseAnonKey!, {
          auth: {
            persistSession: true,
            storage: window.localStorage, // Gunakan localStorage agar lebih stabil di lintas tab
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        })
      ))
  : (new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(supabaseConfigError || 'Supabase belum dikonfigurasi.');
      }
    }) as SupabaseClient);
