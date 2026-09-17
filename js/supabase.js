/**
 * Supabase Client — Initialization & Configuration
 * Hardcoded credentials for project ITEPADEITE
 */
const SupabaseManager = (() => {
  const SUPABASE_URL = 'https://nqsfhfeejqereoylanue.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2ZoZmVlanFlcmVveWxhbnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjI4OTMsImV4cCI6MjEwMTEzODg5M30.n2tnpMlWs59I0mwt3vIa--IHFNVB36dWoERW2XZYLUo';

  let _client = null;

  /**
   * Check if Supabase is configured (always true with hardcoded credentials)
   */
  function isConfigured() {
    return true;
  }

  /**
   * Get config (for display in settings)
   */
  function getConfig() {
    return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
  }

  /**
   * Save config — no-op since hardcoded, but kept for API compatibility
   */
  function saveConfig(url, anonKey) {
    // Credentials are hardcoded, no need to save
    return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
  }

  /**
   * Get or create Supabase client (singleton)
   */
  function getClient() {
    if (_client) return _client;

    try {
      _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      console.log('[Supabase] Client initialized successfully');
      return _client;
    } catch (e) {
      console.error('[Supabase] Failed to create client:', e);
      return null;
    }
  }

  /**
   * Test Supabase connection
   */
  async function testConnection() {
    const client = getClient();
    if (!client) {
      return { ok: false, message: 'Gagal membuat Supabase client.' };
    }

    try {
      const { error } = await client.auth.getSession();
      if (error) {
        return { ok: false, message: error.message };
      }
      return { ok: true, message: 'Terhubung ke Supabase!' };
    } catch (e) {
      return { ok: false, message: e.message || 'Koneksi gagal.' };
    }
  }

  return {
    getConfig,
    saveConfig,
    isConfigured,
    getClient,
    testConnection
  };
})();
