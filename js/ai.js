/**
 * AI Module — Multi-provider AI integration
 * Supports: Gemini, OpenAI, Groq, OpenRouter
 * Updated: Storage calls are now async
 */
const AI = (() => {

  /* ── Provider Definitions ────────────────────────── */

  const PROVIDERS = {
    'gemini-2.5-flash': {
      name: 'Gemini 2.5 Flash',
      group: 'Google Gemini',
      type: 'gemini',
      model: 'gemini-2.5-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      keyPlaceholder: 'AIza...',
      keyLink: 'https://aistudio.google.com/apikey',
      keyLabel: 'Google AI Studio',
      free: true,
      description: 'Terbaru & paling cerdas (Gratis)'
    },
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      group: 'Google Gemini',
      type: 'gemini',
      model: 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      keyPlaceholder: 'AIza...',
      keyLink: 'https://aistudio.google.com/apikey',
      keyLabel: 'Google AI Studio',
      free: true,
      description: 'Cepat & handal (Gratis)'
    },
    'gemini-2.0-flash-lite': {
      name: 'Gemini 2.0 Flash Lite',
      group: 'Google Gemini',
      type: 'gemini',
      model: 'gemini-2.0-flash-lite',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      keyPlaceholder: 'AIza...',
      keyLink: 'https://aistudio.google.com/apikey',
      keyLabel: 'Google AI Studio',
      free: true,
      description: 'Paling ringan, limit tinggi (Gratis)'
    },
    'gemini-1.5-flash': {
      name: 'Gemini 1.5 Flash',
      group: 'Google Gemini',
      type: 'gemini',
      model: 'gemini-1.5-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      keyPlaceholder: 'AIza...',
      keyLink: 'https://aistudio.google.com/apikey',
      keyLabel: 'Google AI Studio',
      free: true,
      description: 'Stabil & teruji (Gratis)'
    },
    'openai-gpt4o-mini': {
      name: 'GPT-4o Mini',
      group: 'OpenAI',
      type: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Murah & cepat (Berbayar)'
    },
    'openai-gpt4o': {
      name: 'GPT-4o',
      group: 'OpenAI',
      type: 'openai',
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Paling pintar OpenAI (Berbayar)'
    },
    'groq-llama': {
      name: 'Llama 3.3 70B (Groq)',
      group: 'Groq',
      type: 'openai',
      model: 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
      keyPlaceholder: 'gsk_...',
      keyLink: 'https://console.groq.com/keys',
      keyLabel: 'Groq Console',
      free: true,
      description: 'Sangat cepat (Gratis)'
    },
    'groq-gemma': {
      name: 'Gemma 2 9B (Groq)',
      group: 'Groq',
      type: 'openai',
      model: 'gemma2-9b-it',
      baseUrl: 'https://api.groq.com/openai/v1',
      keyPlaceholder: 'gsk_...',
      keyLink: 'https://console.groq.com/keys',
      keyLabel: 'Groq Console',
      free: true,
      description: 'Ringan & cepat (Gratis)'
    },
    'openai-gpt4-turbo': {
      name: 'GPT-4 Turbo',
      group: 'OpenAI',
      type: 'openai',
      model: 'gpt-4-turbo',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Paling kuat & konteks besar (Berbayar)'
    },
    'openai-o3-mini': {
      name: 'GPT o3-mini',
      group: 'OpenAI',
      type: 'openai',
      model: 'o3-mini',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Reasoning model, sangat cerdas (Berbayar)'
    },
    'openai-gpt4.1-mini': {
      name: 'GPT-4.1 Mini',
      group: 'OpenAI',
      type: 'openai',
      model: 'gpt-4.1-mini',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Terbaru, cepat & murah (Berbayar)'
    },
    'openai-gpt4.1-nano': {
      name: 'GPT-4.1 Nano',
      group: 'OpenAI',
      type: 'openai',
      model: 'gpt-4.1-nano',
      baseUrl: 'https://api.openai.com/v1',
      keyPlaceholder: 'sk-...',
      keyLink: 'https://platform.openai.com/api-keys',
      keyLabel: 'OpenAI Platform',
      free: false,
      description: 'Paling murah & ringan (Berbayar)'
    },
    'openrouter-auto': {
      name: 'Auto (OpenRouter)',
      group: 'OpenRouter',
      type: 'openai',
      model: 'openrouter/auto',
      baseUrl: 'https://openrouter.ai/api/v1',
      keyPlaceholder: 'sk-or-...',
      keyLink: 'https://openrouter.ai/keys',
      keyLabel: 'OpenRouter',
      free: false,
      description: 'Pilih model terbaik otomatis'
    }
  };

  const DEFAULT_PROVIDER = 'gemini-2.5-flash';

  /* ── Helpers ─────────────────────────────────────── */

  async function getActiveProvider() {
    const id = await Storage.getActiveProvider();
    return PROVIDERS[id] || PROVIDERS[DEFAULT_PROVIDER];
  }

  async function getActiveProviderId() {
    const id = await Storage.getActiveProvider();
    return PROVIDERS[id] ? id : DEFAULT_PROVIDER;
  }

  /* ── Gemini API ──────────────────────────────────── */

  async function callGemini(provider, systemPrompt, userPrompt, apiKey) {
    const url = `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 16384
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await handleGeminiError(response, provider);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';

    if (!text.trim()) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error('Konten diblokir oleh filter keamanan. Coba modifikasi input Anda.');
      }
      throw new Error('AI tidak menghasilkan konten. Silakan coba lagi.');
    }

    return text;
  }

  async function handleGeminiError(response, provider) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || `HTTP ${response.status}`;

    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key tidak valid. Periksa kembali API Key Anda.');
    } else if (response.status === 404) {
      throw new Error(`Model "${provider.model}" tidak tersedia. Error: ${errMsg}`);
    } else if (response.status === 429) {
      throw new Error(`Rate limit tercapai untuk ${provider.name}. Ganti model AI lain di Pengaturan.`);
    } else if (response.status >= 500) {
      throw new Error(`Server ${provider.name} bermasalah. Coba lagi nanti atau ganti model.`);
    } else {
      throw new Error(`Gagal generate: ${errMsg}`);
    }
  }

  /* ── OpenAI-Compatible API (OpenAI, Groq, OpenRouter) ── */

  async function callOpenAI(provider, systemPrompt, userPrompt, apiKey) {
    const url = `${provider.baseUrl}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider.baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.href;
      headers['X-Title'] = 'AI Perangkat Ajar Generator';
    }

    const payload = {
      model: provider.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 16384
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await handleOpenAIError(response, provider);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (!text.trim()) {
      throw new Error('AI tidak menghasilkan konten. Silakan coba lagi.');
    }

    return text;
  }

  async function handleOpenAIError(response, provider) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || `HTTP ${response.status}`;

    if (response.status === 401) {
      throw new Error(`API Key ${provider.group} tidak valid. Periksa kembali.`);
    } else if (response.status === 429) {
      throw new Error(`Rate limit ${provider.name} tercapai. Ganti model AI lain di Pengaturan.`);
    } else if (response.status >= 500) {
      throw new Error(`Server ${provider.group} bermasalah. Coba lagi nanti.`);
    } else {
      throw new Error(`Gagal (${provider.name}): ${errMsg}`);
    }
  }

  /* ── Public: Generate ────────────────────────────── */

  async function generate(type, formData) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('API Key belum diset. Silakan masukkan API Key di menu Pengaturan.');
    }

    const provider = await getActiveProvider();
    const systemPrompt = Templates.getSystemPrompt();
    const userPrompt = Templates.buildUserPrompt(type, formData);

    if (!userPrompt) {
      throw new Error(`Tipe dokumen "${type}" tidak dikenali.`);
    }

    try {
      if (provider.type === 'gemini') {
        return await callGemini(provider, systemPrompt, userPrompt, apiKey);
      } else {
        return await callOpenAI(provider, systemPrompt, userPrompt, apiKey);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      }
      throw error;
    }
  }

  /* ── Public: Test Connection ─────────────────────── */

  async function testConnection() {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      return { valid: false, message: 'API Key belum diisi.' };
    }

    const provider = await getActiveProvider();

    try {
      if (provider.type === 'gemini') {
        const url = `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Balas dengan satu kata: "Terhubung"' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 20 }
          })
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          return { valid: false, message: errBody?.error?.message || `HTTP ${response.status}` };
        }
        return { valid: true, message: `Terhubung! → ${provider.name}` };

      } else {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        if (provider.baseUrl.includes('openrouter.ai')) {
          headers['HTTP-Referer'] = window.location.href;
        }
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Reply with one word: "Connected"' }],
            max_tokens: 10
          })
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          return { valid: false, message: errBody?.error?.message || `HTTP ${response.status}` };
        }
        return { valid: true, message: `Terhubung! → ${provider.name}` };
      }
    } catch (error) {
      return { valid: false, message: error.message || 'Koneksi gagal.' };
    }
  }

  /* ── Public: Chat (Multi-turn) ────────────────────── */

  async function chat(messages) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('API Key belum diset. Silakan masukkan API Key di menu Pengaturan.');
    }

    const provider = await getActiveProvider();

    try {
      if (provider.type === 'gemini') {
        return await callGeminiChat(provider, messages, apiKey);
      } else {
        return await callOpenAIChat(provider, messages, apiKey);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      }
      throw error;
    }
  }

  async function callGeminiChat(provider, messages, apiKey) {
    const url = `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`;

    // Convert messages to Gemini format
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192
      }
    };

    if (systemMsg) {
      payload.system_instruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await handleGeminiError(response, provider);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';

    if (!text.trim()) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error('Konten diblokir oleh filter keamanan. Coba modifikasi pertanyaan Anda.');
      }
      throw new Error('AI tidak menghasilkan jawaban. Silakan coba lagi.');
    }

    return text;
  }

  async function callOpenAIChat(provider, messages, apiKey) {
    const url = `${provider.baseUrl}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider.baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.href;
      headers['X-Title'] = 'AI Perangkat Ajar Generator';
    }

    const payload = {
      model: provider.model,
      messages,
      temperature: 0.7,
      max_tokens: 8192
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await handleOpenAIError(response, provider);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (!text.trim()) {
      throw new Error('AI tidak menghasilkan jawaban. Silakan coba lagi.');
    }

    return text;
  }

  /* ── Public API ──────────────────────────────────── */

  return {
    generate,
    chat,
    testConnection,
    PROVIDERS,
    DEFAULT_PROVIDER,
    getActiveProvider,
    getActiveProviderId
  };
})();
