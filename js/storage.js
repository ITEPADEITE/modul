/**
 * Storage Manager — Supabase-backed storage for Perangkat Ajar AI
 * Manages API keys, user settings (profiles table), and document history (documents table)
 * All functions are async (return Promises)
 */
const Storage = (() => {
  const DEFAULT_SETTINGS = {
    namaGuru: '',
    namaSekolah: '',
    nip: '',
    mataPelajaranDefault: '',
    kelasDefault: '',
    tahunAjaran: '2026/2027'
  };

  /* ── Helper: get current user ID ───────────────── */

  function getUserId() {
    const user = Auth.getCurrentUser();
    return user?.id || null;
  }

  /* ── API Keys (stored in profiles.api_keys JSONB) ── */

  async function getAllApiKeys() {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return {};

    try {
      const { data, error } = await client
        .from('profiles')
        .select('api_keys')
        .eq('id', userId)
        .single();

      if (error || !data) return {};
      return data.api_keys || {};
    } catch (e) {
      console.error('[Storage] getAllApiKeys error:', e);
      return {};
    }
  }

  async function getApiKey() {
    const providerId = await getActiveProvider();
    const keys = await getAllApiKeys();
    return keys[providerId] || '';
  }

  async function getApiKeyFor(providerId) {
    const keys = await getAllApiKeys();
    return keys[providerId] || '';
  }

  async function setApiKey(key, providerId) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
      const keys = await getAllApiKeys();
      const id = providerId || await getActiveProvider();
      keys[id] = key.trim();

      // Share key across same-platform models
      const groupMap = {
        'gemini-2.5-flash': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'],
        'gemini-2.0-flash': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'],
        'gemini-2.0-flash-lite': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'],
        'gemini-1.5-flash': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'],
        'openai-gpt4o-mini': ['openai-gpt4o-mini', 'openai-gpt4o'],
        'openai-gpt4o': ['openai-gpt4o-mini', 'openai-gpt4o'],
        'groq-llama': ['groq-llama', 'groq-gemma'],
        'groq-gemma': ['groq-llama', 'groq-gemma']
      };

      const siblings = groupMap[id] || [id];
      siblings.forEach(sibId => {
        keys[sibId] = key.trim();
      });

      await client
        .from('profiles')
        .update({ api_keys: keys })
        .eq('id', userId);
    } catch (e) {
      console.error('[Storage] setApiKey error:', e);
    }
  }

  /* ── Active Provider (stored in profiles.active_provider) ── */

  async function getActiveProvider() {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return 'gemini-2.5-flash';

    try {
      const { data, error } = await client
        .from('profiles')
        .select('active_provider')
        .eq('id', userId)
        .single();

      if (error || !data) return 'gemini-2.5-flash';
      return data.active_provider || 'gemini-2.5-flash';
    } catch (e) {
      return 'gemini-2.5-flash';
    }
  }

  async function setActiveProvider(providerId) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
      await client
        .from('profiles')
        .update({ active_provider: providerId })
        .eq('id', userId);
    } catch (e) {
      console.error('[Storage] setActiveProvider error:', e);
    }
  }

  /* ── Settings (stored in profiles table columns) ── */

  async function getSettings() {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return { ...DEFAULT_SETTINGS };

    try {
      const { data, error } = await client
        .from('profiles')
        .select('name, school, nip, mata_pelajaran_default, kelas_default, tahun_ajaran')
        .eq('id', userId)
        .single();

      if (error || !data) return { ...DEFAULT_SETTINGS };

      return {
        namaGuru: data.name || '',
        namaSekolah: data.school || '',
        nip: data.nip || '',
        mataPelajaranDefault: data.mata_pelajaran_default || '',
        kelasDefault: data.kelas_default || '',
        tahunAjaran: data.tahun_ajaran || '2025/2026'
      };
    } catch (e) {
      console.error('[Storage] getSettings error:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  async function saveSettings(settings) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
      const updateData = {};
      if (settings.namaGuru !== undefined) updateData.name = settings.namaGuru;
      if (settings.namaSekolah !== undefined) updateData.school = settings.namaSekolah;
      if (settings.nip !== undefined) updateData.nip = settings.nip;
      if (settings.mataPelajaranDefault !== undefined) updateData.mata_pelajaran_default = settings.mataPelajaranDefault;
      if (settings.kelasDefault !== undefined) updateData.kelas_default = settings.kelasDefault;
      if (settings.tahunAjaran !== undefined) updateData.tahun_ajaran = settings.tahunAjaran;

      await client
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
    } catch (e) {
      console.error('[Storage] saveSettings error:', e);
    }
  }

  /* ── History (stored in documents table) ─────────── */

  async function getHistory() {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return [];

    try {
      const { data, error } = await client
        .from('documents')
        .select('id, type, title, content, form_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Storage] getHistory error:', error);
        return [];
      }

      // Map to format expected by the app
      return (data || []).map(doc => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        formData: doc.form_data || {},
        timestamp: doc.created_at
      }));
    } catch (e) {
      console.error('[Storage] getHistory error:', e);
      return [];
    }
  }

  async function addToHistory(item) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return null;

    try {
      const { data, error } = await client
        .from('documents')
        .insert({
          user_id: userId,
          type: item.type,
          title: item.title || 'Tanpa Judul',
          content: item.content || '',
          form_data: item.formData || {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Storage] addToHistory error:', error);
        return null;
      }
      return data?.id || null;
    } catch (e) {
      console.error('[Storage] addToHistory error:', e);
      return null;
    }
  }

  async function getHistoryItem(id) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return null;

    try {
      const { data, error } = await client
        .from('documents')
        .select('id, type, title, content, form_data, created_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        type: data.type,
        title: data.title,
        content: data.content,
        formData: data.form_data || {},
        timestamp: data.created_at
      };
    } catch (e) {
      return null;
    }
  }

  async function deleteFromHistory(id) {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
      await client
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (e) {
      console.error('[Storage] deleteFromHistory error:', e);
    }
  }

  async function clearHistory() {
    const client = SupabaseManager.getClient();
    const userId = getUserId();
    if (!client || !userId) return;

    try {
      await client
        .from('documents')
        .delete()
        .eq('user_id', userId);
    } catch (e) {
      console.error('[Storage] clearHistory error:', e);
    }
  }

  /* ── Public API ──────────────────────────────────── */

  return {
    getApiKey,
    getApiKeyFor,
    setApiKey,
    getAllApiKeys,
    getActiveProvider,
    setActiveProvider,
    getSettings,
    saveSettings,
    getHistory,
    addToHistory,
    getHistoryItem,
    deleteFromHistory,
    clearHistory,
    DEFAULT_SETTINGS
  };
})();
