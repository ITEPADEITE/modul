/**
 * Chat Module — Interactive AI Chatbot
 * Multi-turn conversations with any AI provider
 * Features: typing indicator, markdown rendering, auto-scroll, keyboard shortcuts
 */
const Chat = (() => {

  /* ── State ─────────────────────────────────────────── */
  let messages = [];
  let isSending = false;

  const SYSTEM_PROMPT = `Kamu adalah "Asisten Guru AI" yang sangat ahli dalam bidang pendidikan Indonesia, khususnya Kurikulum Merdeka.

Kemampuanmu meliputi:
- Menjawab pertanyaan seputar Kurikulum Merdeka, Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), ATP
- Membantu membuat dan mereview Modul Ajar, RPP, LKPD, Silabus, Soal/Asesmen
- Memberikan ide pembelajaran kreatif, strategi pengajaran, pendekatan DEEP Learning
- Menjelaskan konsep pedagogis, asesmen formatif & sumatif, diferensiasi pembelajaran
- Membantu menyusun Profil Pelajar Pancasila (P5) dan projek penguatan
- Memberikan saran pengembangan profesional guru

Aturan:
- Jawab dalam Bahasa Indonesia yang baik dan profesional
- Berikan jawaban yang praktis, terstruktur, dan langsung bisa diterapkan
- Gunakan format markdown (heading, list, bold, tabel) agar mudah dibaca
- Jika diminta membuat dokumen, buat yang lengkap dan sesuai format resmi
- Bersikap ramah, supportif, dan memotivasi guru`;

  /* ── Initialize ───────────────────────────────────── */

  function init() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 160) + 'px';
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    renderMessages();
    console.log('[Chat] Initialized');
  }

  /* ── Send Message ─────────────────────────────────── */

  async function sendMessage() {
    if (isSending) return;

    const input = document.getElementById('chatInput');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    // Check API key
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      App.showToast('API Key belum diset. Buka Pengaturan untuk mengatur API Key.', 'error');
      return;
    }

    // Add user message
    messages.push({ role: 'user', content: text });
    renderMessages();

    // Clear input
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    // Show typing indicator
    showTypingIndicator();
    isSending = true;
    updateSendButton(true);

    try {
      // Build API messages with system prompt
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ];

      const response = await AI.chat(apiMessages);

      // Add assistant message
      messages.push({ role: 'assistant', content: response });

    } catch (error) {
      // Add error as system message
      messages.push({
        role: 'assistant',
        content: `⚠️ **Error:** ${error.message}`,
        isError: true
      });
      App.showToast(error.message, 'error');
    } finally {
      isSending = false;
      hideTypingIndicator();
      updateSendButton(false);
      renderMessages();
    }
  }

  /* ── Render Messages ──────────────────────────────── */

  function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = renderWelcomeScreen();
      return;
    }

    let html = '';
    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        html += renderUserBubble(msg, idx);
      } else if (msg.role === 'assistant') {
        html += renderAssistantBubble(msg, idx);
      }
    });

    container.innerHTML = html;
    scrollToBottom();
  }

  function renderWelcomeScreen() {
    return `
      <div class="chat-welcome">
        <div class="chat-welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
            <line x1="9" y1="21" x2="15" y2="21"/>
            <line x1="10" y1="24" x2="14" y2="24"/>
          </svg>
        </div>
        <h2>Asisten Guru AI</h2>
        <p>Tanya apa saja seputar Kurikulum Merdeka, perangkat ajar, strategi pembelajaran, dan lainnya.</p>
        <div class="chat-suggestions">
          <button class="chat-suggestion-chip" onclick="Chat.quickSend('Buatkan contoh Modul Ajar Matematika kelas 10 tentang Fungsi Kuadrat')">
            📘 Contoh Modul Ajar
          </button>
          <button class="chat-suggestion-chip" onclick="Chat.quickSend('Jelaskan perbedaan asesmen formatif dan sumatif dalam Kurikulum Merdeka')">
            📝 Asesmen Formatif vs Sumatif
          </button>
          <button class="chat-suggestion-chip" onclick="Chat.quickSend('Berikan 5 strategi pembelajaran diferensiasi untuk kelas heterogen')">
            🎯 Strategi Diferensiasi
          </button>
          <button class="chat-suggestion-chip" onclick="Chat.quickSend('Bagaimana cara mengintegrasikan Profil Pelajar Pancasila (P5) dalam pembelajaran sehari-hari?')">
            🇮🇩 Integrasi P5
          </button>
        </div>
      </div>`;
  }

  function renderUserBubble(msg, idx) {
    return `
      <div class="chat-row chat-row-user">
        <div class="chat-bubble chat-bubble-user">
          <div class="chat-bubble-content">${escapeHtml(msg.content)}</div>
          <div class="chat-bubble-actions">
            <button class="chat-action-btn" onclick="Chat.copyMessage(${idx})" title="Salin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="chat-avatar chat-avatar-user">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>`;
  }

  function renderAssistantBubble(msg, idx) {
    const contentHtml = msg.isError ? msg.content : markdownToHtml(msg.content);
    return `
      <div class="chat-row chat-row-assistant">
        <div class="chat-avatar chat-avatar-ai">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
            <line x1="9" y1="21" x2="15" y2="21"/>
          </svg>
        </div>
        <div class="chat-bubble chat-bubble-assistant ${msg.isError ? 'chat-bubble-error' : ''}">
          <div class="chat-bubble-content">${contentHtml}</div>
          <div class="chat-bubble-actions">
            <button class="chat-action-btn" onclick="Chat.copyMessage(${idx})" title="Salin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  /* ── Typing Indicator ─────────────────────────────── */

  function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.id = 'chatTyping';
    indicator.className = 'chat-row chat-row-assistant';
    indicator.innerHTML = `
      <div class="chat-avatar chat-avatar-ai">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
          <line x1="9" y1="21" x2="15" y2="21"/>
        </svg>
      </div>
      <div class="chat-bubble chat-bubble-assistant chat-typing-bubble">
        <div class="chat-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>`;

    container.appendChild(indicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const el = document.getElementById('chatTyping');
    if (el) el.remove();
  }

  /* ── Helper Functions ─────────────────────────────── */

  function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  function updateSendButton(loading) {
    const btn = document.getElementById('chatSendBtn');
    if (!btn) return;

    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<div class="chat-send-spinner"></div>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    }
  }

  async function copyMessage(idx) {
    if (idx >= 0 && idx < messages.length) {
      try {
        await navigator.clipboard.writeText(messages[idx].content);
        App.showToast('Pesan disalin!', 'success');
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = messages[idx].content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        App.showToast('Pesan disalin!', 'success');
      }
    }
  }

  function quickSend(text) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = text;
    }
    sendMessage();
  }

  function clearChat() {
    if (messages.length === 0) return;
    if (!confirm('Yakin ingin menghapus semua percakapan?')) return;
    messages = [];
    renderMessages();
    App.showToast('Percakapan dihapus.', 'info');
  }

  /* ── Markdown to HTML (simplified for chat) ───────── */

  function markdownToHtml(md) {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="chat-code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

    // Tables
    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => {
      const rows = match.trim().split('\n').filter(r => !/^\|[\s-:|]+\|$/.test(r));
      if (rows.length === 0) return match;
      let table = '<table class="chat-table">';
      rows.forEach((row, idx) => {
        const cells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        table += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
      });
      table += '</table>';
      return table;
    });

    // Headings
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Horizontal rule
    html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

    // Lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');
    html = html.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li>
    html = html.replace(/((?:<li(?:\s[^>]*)?>[\s\S]*?<\/li>\s*)+)/g, (match) => {
      if (match.includes('ol-item')) {
        return '<ol>' + match.replace(/class="ol-item"/g, '') + '</ol>';
      }
      return '<ul>' + match + '</ul>';
    });

    // Paragraphs
    html = html.replace(/^(?!<[hultrop]|$)(.+)$/gm, '<p>$1</p>');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
              .replace(/\n/g, '<br>');
  }

  /* ── Public API ───────────────────────────────────── */

  return {
    init,
    sendMessage,
    copyMessage,
    quickSend,
    clearChat
  };
})();
