/**
 * App — Main application controller for AI Perangkat Ajar Generator
 * Handles routing, form rendering, generation, and UI orchestration
 * Updated: All Storage/AI calls are now async (Supabase backend)
 */
const App = (() => {

  /* ── State ───────────────────────────────────────── */
  let currentPage = 'dashboard';
  let currentType = null;
  let currentResult = null;
  let isGenerating = false;

  /* ── Initialization ──────────────────────────────── */

  async function init() {
    // Setup routing
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // Setup sidebar nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        window.location.hash = page;
      });
    });

    // Setup mobile
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('mobileOverlay');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }
    if (overlay) {
      overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // Update API status
    await updateApiStatus();

    // Load settings into form
    await loadSettingsForm();

    // Load Supabase config into form
    loadSupabaseConfigForm();

    // Render dashboard
    await renderDashboard();

    // Setup auth listener
    if (typeof Auth !== 'undefined' && Auth.setupAuthListener) {
      Auth.setupAuthListener();
    }

    console.log('[App] Initialized');
  }

  /* ── Routing ─────────────────────────────────────── */

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';

    const generatorTypes = [
      'modul-ajar', 'rpp', 'lkpd', 'soal', 'silabus',
      'capaian-pembelajaran', 'tujuan-pembelajaran', 'deep-learning'
    ];

    if (generatorTypes.includes(hash)) {
      navigateToGenerator(hash);
    } else if (hash === 'chat') {
      navigateToPage('chat');
      initChatPage();
    } else if (hash === 'riwayat') {
      navigateToPage('riwayat');
      renderHistory();
    } else if (hash === 'pengaturan') {
      navigateToPage('pengaturan');
      loadSettingsForm();
      loadSupabaseConfigForm();
    } else {
      navigateToPage('dashboard');
      renderDashboard();
    }

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === hash);
    });

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('mobileOverlay')?.classList.remove('active');
  }

  function navigateToPage(page) {
    currentPage = page;
    currentType = null;
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    const section = document.getElementById(`page-${page}`);
    if (section) {
      section.style.display = 'block';
      section.style.animation = 'none';
      section.offsetHeight;
      section.style.animation = '';
    }
  }

  function navigateToGenerator(type) {
    currentPage = 'generator';
    currentType = type;
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    const section = document.getElementById('page-generator');
    if (section) {
      section.style.display = 'block';
      section.style.animation = 'none';
      section.offsetHeight;
      section.style.animation = '';
    }
    renderGeneratorForm(type);
  }

  /* ── Dashboard ───────────────────────────────────── */

  async function renderDashboard() {
    // Update greeting with user name
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const heroH2 = document.querySelector('.dashboard-hero h2');
    if (heroH2 && user && user.name) {
      heroH2.textContent = `Selamat Datang, ${user.name}! 👋`;
    }

    // Update stats
    const history = await Storage.getHistory();
    const statCount = document.getElementById('statCount');
    if (statCount) statCount.textContent = history.length;

    // Get today's count
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = history.filter(h => h.timestamp?.startsWith(today)).length;
    const statToday = document.getElementById('statToday');
    if (statToday) statToday.textContent = todayCount;

    // Render recent docs
    const recentContainer = document.getElementById('recentDocs');
    if (!recentContainer) return;

    const recent = history.slice(0, 5);
    if (recent.length === 0) {
      recentContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <h3>Belum ada dokumen</h3>
          <p>Mulai buat perangkat ajar pertama Anda dari menu di samping</p>
        </div>`;
      return;
    }

    recentContainer.innerHTML = `<div class="recent-list">
      ${recent.map(item => {
        const template = Templates.getTemplate(item.type);
        const date = formatDate(item.timestamp);
        return `
          <div class="recent-item" onclick="App.viewHistoryItem('${item.id}')">
            <div class="recent-item-icon" style="background:${template ? hexToRgba(template.color, 0.12) : 'var(--bg-card)'}; color:${template?.color || 'var(--text-secondary)'}">
              ${template?.icon || '📄'}
            </div>
            <div class="recent-item-info">
              <div class="recent-item-title">${escapeHtml(item.title || 'Tanpa Judul')}</div>
              <div class="recent-item-meta">
                <span>${template?.title || item.type}</span>
                <span>•</span>
                <span>${date}</span>
              </div>
            </div>
            <div class="recent-item-actions">
              <button class="btn btn-icon" onclick="event.stopPropagation(); App.downloadHistoryItem('${item.id}')" title="Download Word">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  }

  /* ── Generator Form ──────────────────────────────── */

  async function renderGeneratorForm(type) {
    const template = Templates.getTemplate(type);
    if (!template) return;

    // Update header
    const title = document.getElementById('generatorTitle');
    const subtitle = document.getElementById('generatorSubtitle');
    if (title) title.textContent = `Generator ${template.title}`;
    if (subtitle) subtitle.textContent = template.subtitle;

    // Update form header
    const formIcon = document.getElementById('formPanelIcon');
    const formTitle = document.getElementById('formPanelTitle');
    const formSubtitle = document.getElementById('formPanelSubtitle');
    if (formIcon) {
      formIcon.innerHTML = template.icon;
      formIcon.style.background = hexToRgba(template.color, 0.12);
      formIcon.style.color = template.color;
    }
    if (formTitle) formTitle.textContent = template.title;
    if (formSubtitle) formSubtitle.textContent = template.subtitle;

    // Build form fields
    const fieldsContainer = document.getElementById('formFields');
    if (!fieldsContainer) return;

    const settings = await Storage.getSettings();

    fieldsContainer.innerHTML = template.fields.map(field => {
      let defaultValue = '';
      if (field.id === 'mata_pelajaran' && settings.mataPelajaranDefault) {
        defaultValue = settings.mataPelajaranDefault;
      }
      if (field.id === 'kelas' && settings.kelasDefault) {
        defaultValue = settings.kelasDefault;
      }

      if (field.type === 'select') {
        return `
          <div class="form-group">
            <label class="form-label" for="field_${field.id}">
              ${field.label}${field.required ? '<span class="required">*</span>' : ''}
            </label>
            <select class="form-select" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>
              ${(field.options || []).map(opt => 
                `<option value="${escapeHtml(opt.value)}" ${opt.value === defaultValue ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
              ).join('')}
            </select>
          </div>`;
      } else if (field.type === 'textarea') {
        return `
          <div class="form-group">
            <label class="form-label" for="field_${field.id}">
              ${field.label}${field.required ? '<span class="required">*</span>' : ''}
            </label>
            <textarea class="form-textarea" id="field_${field.id}" name="${field.id}" 
              placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
          </div>`;
      } else {
        return `
          <div class="form-group">
            <label class="form-label" for="field_${field.id}">
              ${field.label}${field.required ? '<span class="required">*</span>' : ''}
            </label>
            <input class="form-input" type="${field.type}" id="field_${field.id}" name="${field.id}" 
              placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}
              ${field.min !== undefined ? `min="${field.min}"` : ''}
              ${field.max !== undefined ? `max="${field.max}"` : ''}
              ${defaultValue ? `value="${escapeHtml(defaultValue)}"` : ''}>
          </div>`;
      }
    }).join('');

    // Reset result panel
    showResultPlaceholder();
  }

  /* ── Generate ────────────────────────────────────── */

  async function handleGenerate() {
    if (isGenerating || !currentType) return;

    // Validate API key
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      showToast('API Key belum diset. Buka menu Pengaturan untuk mengatur API Key.', 'error');
      return;
    }

    // Collect form data
    const template = Templates.getTemplate(currentType);
    if (!template) return;

    const formData = {};
    let hasError = false;

    template.fields.forEach(field => {
      const el = document.getElementById(`field_${field.id}`);
      const value = el ? el.value.trim() : '';
      formData[field.id] = value;

      if (field.required && !value) {
        el?.classList.add('error');
        hasError = true;
      } else {
        el?.classList.remove('error');
      }
    });

    if (hasError) {
      showToast('Mohon isi semua field yang wajib (*)', 'warning');
      return;
    }

    // Start generating
    isGenerating = true;
    showResultLoading();
    const generateBtn = document.getElementById('btnGenerate');
    if (generateBtn) {
      generateBtn.classList.add('loading');
      generateBtn.disabled = true;
    }

    try {
      const content = await AI.generate(currentType, formData);
      currentResult = {
        type: currentType,
        content,
        formData,
        title: buildDocTitle(currentType, formData),
        templateTitle: template.title
      };

      // Save to history
      await Storage.addToHistory({
        type: currentType,
        title: currentResult.title,
        content,
        formData
      });

      // Show result
      showResultContent(content);
      showToast(`${template.title} berhasil dibuat!`, 'success');

    } catch (error) {
      showToast(error.message, 'error');
      showResultPlaceholder();
    } finally {
      isGenerating = false;
      if (generateBtn) {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
      }
    }
  }

  function buildDocTitle(type, formData) {
    const template = Templates.getTemplate(type);
    const subject = formData.mata_pelajaran || '';
    const kelas = formData.kelas || '';
    const topic = formData.topik || formData.materi_pokok || formData.materi || '';
    return `${template?.title || type} - ${subject}${topic ? ` - ${topic}` : ''} ${kelas}`.trim();
  }

  /* ── Result Panel ────────────────────────────────── */

  function showResultPlaceholder() {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const loading = document.getElementById('resultLoading');
    const toolbar = document.getElementById('resultToolbar');

    if (placeholder) placeholder.style.display = 'flex';
    if (content) content.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';
  }

  function showResultLoading() {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const loading = document.getElementById('resultLoading');
    const toolbar = document.getElementById('resultToolbar');

    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'none';
    if (loading) loading.style.display = 'flex';
    if (toolbar) toolbar.style.display = 'none';
  }

  function showResultContent(markdown) {
    const placeholder = document.getElementById('resultPlaceholder');
    const content = document.getElementById('resultContent');
    const loading = document.getElementById('resultLoading');
    const toolbar = document.getElementById('resultToolbar');
    const resultText = document.getElementById('resultText');

    if (placeholder) placeholder.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
    if (toolbar) toolbar.style.display = 'flex';

    if (resultText) {
      resultText.innerHTML = markdownToHtml(markdown);
    }
  }

  /* ── Markdown to HTML ────────────────────────────── */

  function markdownToHtml(md) {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tables
    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (match) => {
      const rows = match.trim().split('\n').filter(r => !/^\|[\s-:|]+\|$/.test(r));
      if (rows.length === 0) return match;
      let table = '<table>';
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

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li(?:\s[^>]*)?>[\s\S]*?<\/li>\s*)+)/g, (match) => {
      if (match.includes('ol-item')) {
        return '<ol>' + match.replace(/class="ol-item"/g, '') + '</ol>';
      }
      return '<ul>' + match + '</ul>';
    });

    // Paragraphs
    html = html.replace(/^(?!<[hultro]|$)(.+)$/gm, '<p>$1</p>');
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  /* ── Download ────────────────────────────────────── */

  async function handleDownload() {
    if (!currentResult) {
      showToast('Belum ada dokumen untuk didownload.', 'warning');
      return;
    }

    if (!DocxExport.isReady()) {
      showToast('Library ekspor Word belum siap. Refresh halaman dan coba lagi.', 'error');
      return;
    }

    try {
      const fileName = await DocxExport.exportToWord(currentResult.content, {
        type: currentResult.type,
        title: currentResult.title,
        templateTitle: currentResult.templateTitle
      });
      showToast(`Berhasil didownload: ${fileName}`, 'success');
    } catch (error) {
      console.error('[App] Download error:', error);
      showToast('Gagal membuat file Word: ' + error.message, 'error');
    }
  }

  /* ── Copy ────────────────────────────────────────── */

  async function handleCopy() {
    if (!currentResult?.content) {
      showToast('Tidak ada konten untuk disalin.', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentResult.content);
      showToast('Konten berhasil disalin ke clipboard!', 'success');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentResult.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Konten berhasil disalin!', 'success');
    }
  }

  /* ── History ─────────────────────────────────────── */

  async function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;

    // Show loading
    container.innerHTML = `
      <div class="empty-state">
        <div class="loading-spinner" style="width:32px;height:32px;margin:0 auto 12px;"></div>
        <p>Memuat riwayat...</p>
      </div>`;

    const history = await Storage.getHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🕒</div>
          <h3>Belum ada riwayat</h3>
          <p>Dokumen yang Anda buat akan muncul di sini</p>
        </div>`;
      return;
    }

    container.innerHTML = history.map(item => {
      const template = Templates.getTemplate(item.type);
      const date = formatDate(item.timestamp);
      const badgeClass = getBadgeClass(item.type);
      return `
        <div class="history-item">
          <div class="history-item-icon" style="background:${template ? hexToRgba(template.color, 0.12) : 'var(--bg-card)'}; color:${template?.color || 'var(--text-secondary)'}">
            ${template?.icon || '📄'}
          </div>
          <div class="history-item-info">
            <div class="history-item-title">${escapeHtml(item.title || 'Tanpa Judul')}</div>
            <div class="history-item-meta">
              <span class="badge ${badgeClass}">${template?.title || item.type}</span>
              <span>${date}</span>
            </div>
          </div>
          <div class="history-item-actions">
            <button class="btn btn-ghost btn-icon" onclick="App.viewHistoryItem('${item.id}')" title="Lihat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" onclick="App.downloadHistoryItem('${item.id}')" title="Download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" onclick="App.deleteHistoryItem('${item.id}')" title="Hapus">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  async function viewHistoryItem(id) {
    const item = await Storage.getHistoryItem(id);
    if (!item) {
      showToast('Dokumen tidak ditemukan.', 'error');
      return;
    }

    currentType = item.type;
    currentResult = {
      type: item.type,
      content: item.content,
      title: item.title,
      templateTitle: Templates.getTemplate(item.type)?.title || item.type
    };

    window.location.hash = item.type;

    setTimeout(() => {
      showResultContent(item.content);
    }, 100);
  }

  async function downloadHistoryItem(id) {
    const item = await Storage.getHistoryItem(id);
    if (!item) {
      showToast('Dokumen tidak ditemukan.', 'error');
      return;
    }

    if (!DocxExport.isReady()) {
      showToast('Library ekspor Word belum siap.', 'error');
      return;
    }

    try {
      const template = Templates.getTemplate(item.type);
      const fileName = await DocxExport.exportToWord(item.content, {
        type: item.type,
        title: item.title,
        templateTitle: template?.title || item.type
      });
      showToast(`Berhasil: ${fileName}`, 'success');
    } catch (error) {
      showToast('Gagal download: ' + error.message, 'error');
    }
  }

  async function deleteHistoryItem(id) {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    await Storage.deleteFromHistory(id);
    await renderHistory();
    showToast('Dokumen dihapus.', 'info');
  }

  async function clearAllHistory() {
    if (!confirm('Yakin ingin menghapus SEMUA riwayat? Tindakan ini tidak dapat dibatalkan.')) return;
    await Storage.clearHistory();
    await renderHistory();
    showToast('Semua riwayat dihapus.', 'info');
  }

  /* ── Settings ────────────────────────────────────── */

  async function loadSettingsForm() {
    const settings = await Storage.getSettings();

    // Populate provider dropdown
    await populateProviderDropdown();

    // Load API key for current provider
    await updateProviderUI();

    setFieldValue('settingsNamaGuru', settings.namaGuru);
    setFieldValue('settingsNamaSekolah', settings.namaSekolah);
    setFieldValue('settingsNip', settings.nip);
    setFieldValue('settingsMapelDefault', settings.mataPelajaranDefault);
    setFieldValue('settingsTahunAjaran', settings.tahunAjaran);
  }

  async function populateProviderDropdown() {
    const select = document.getElementById('settingsProvider');
    if (!select) return;

    const activeId = await AI.getActiveProviderId();
    const providers = AI.PROVIDERS;

    const groups = {};
    Object.entries(providers).forEach(([id, p]) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push({ id, ...p });
    });

    let html = '';
    Object.entries(groups).forEach(([groupName, items]) => {
      html += `<optgroup label="${groupName}">`;
      items.forEach(item => {
        const badge = item.free ? '🟢 Gratis' : '🔶 Berbayar';
        html += `<option value="${item.id}" ${item.id === activeId ? 'selected' : ''}>${item.name} — ${badge}</option>`;
      });
      html += '</optgroup>';
    });

    select.innerHTML = html;
  }

  async function updateProviderUI() {
    const activeId = await AI.getActiveProviderId();
    const provider = AI.PROVIDERS[activeId];
    if (!provider) return;

    // Update API key input
    const apiKey = await Storage.getApiKeyFor(activeId);
    setFieldValue('settingsApiKey', apiKey);

    const keyInput = document.getElementById('settingsApiKey');
    if (keyInput) keyInput.placeholder = provider.keyPlaceholder || 'Masukkan API Key...';

    // Update key label
    const keyLabel = document.getElementById('providerKeyLabel');
    if (keyLabel) keyLabel.textContent = `(${provider.group})`;

    // Provider info badge
    const infoEl = document.getElementById('providerInfo');
    if (infoEl) {
      const badgeColor = provider.free 
        ? 'background:var(--success-bg); color:var(--success); border:1px solid rgba(16,185,129,0.2);'
        : 'background:var(--warning-bg); color:var(--warning); border:1px solid rgba(245,158,11,0.2);';
      infoEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="badge" style="${badgeColor} padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600;">
            ${provider.free ? '🟢 Gratis' : '🔶 Berbayar'}
          </span>
          <span style="font-size:12px; color:var(--text-secondary)">${provider.description}</span>
        </div>`;
    }

    // Help text
    const helpEl = document.getElementById('providerHelpText');
    if (helpEl) {
      helpEl.innerHTML = `
        💡 Dapatkan API Key di 
        <a href="${provider.keyLink}" target="_blank" style="color:var(--accent-indigo); text-decoration:underline">${provider.keyLabel}</a>. 
        Key tersimpan di cloud dan tersinkron antar device.
        ${provider.type === 'gemini' ? '<br>📌 Key Gemini otomatis berlaku untuk semua model Gemini.' : ''}
        ${provider.group === 'Groq' ? '<br>📌 Key Groq otomatis berlaku untuk semua model Groq.' : ''}
        <br>⚡ Jika model ini <strong>limit</strong>, ganti ke model lain di atas.`;
    }

    await updateApiStatus();
  }

  async function onProviderChange() {
    const select = document.getElementById('settingsProvider');
    if (!select) return;

    await Storage.setActiveProvider(select.value);
    await updateProviderUI();
    showToast(`Model AI diganti ke ${AI.PROVIDERS[select.value]?.name || select.value}`, 'info');
  }

  async function saveApiKey() {
    const input = document.getElementById('settingsApiKey');
    const key = input ? input.value.trim() : '';
    
    if (!key) {
      showToast('API Key tidak boleh kosong.', 'warning');
      return;
    }

    await Storage.setApiKey(key);
    await updateApiStatus();
    showToast('API Key tersimpan!', 'success');

    // Test connection
    await testApiConnection();
  }

  async function testApiConnection() {
    const statusEl = document.getElementById('apiStatusText');
    const dotEl = document.querySelector('.status-dot');

    if (statusEl) statusEl.textContent = 'Menguji koneksi...';

    const result = await AI.testConnection();

    if (result.valid) {
      if (statusEl) statusEl.textContent = result.message;
      if (dotEl) dotEl.classList.add('connected');
      showToast('Koneksi berhasil!', 'success');
    } else {
      if (statusEl) statusEl.textContent = result.message;
      if (dotEl) dotEl.classList.remove('connected');
      showToast('Koneksi gagal: ' + result.message, 'error');
    }
  }

  async function saveProfile() {
    const settings = {
      namaGuru: getFieldValue('settingsNamaGuru'),
      namaSekolah: getFieldValue('settingsNamaSekolah'),
      nip: getFieldValue('settingsNip'),
      mataPelajaranDefault: getFieldValue('settingsMapelDefault'),
      tahunAjaran: getFieldValue('settingsTahunAjaran')
    };

    await Storage.saveSettings(settings);
    showToast('Profil tersimpan!', 'success');
  }

  async function updateApiStatus() {
    const dotEl = document.querySelector('.status-dot');
    const textEl = document.getElementById('apiStatusText');
    const hasKey = !!(await Storage.getApiKey());
    const provider = await AI.getActiveProvider();

    if (dotEl) dotEl.classList.toggle('connected', hasKey);
    if (textEl) {
      textEl.textContent = hasKey 
        ? `${provider.name}` 
        : 'API Key belum diset';
    }
  }

  /* ── Supabase Config ─────────────────────────────── */

  function loadSupabaseConfigForm() {
    const config = SupabaseManager.getConfig();
    setFieldValue('supabaseUrl', config.url);
    setFieldValue('supabaseAnonKey', config.anonKey);

    // Update status indicator
    updateSupabaseStatus();
  }

  function updateSupabaseStatus() {
    const statusEl = document.getElementById('supabaseStatusText');
    const dotEl = document.getElementById('supabaseDot');
    const configured = SupabaseManager.isConfigured();

    if (dotEl) dotEl.classList.toggle('connected', configured);
    if (statusEl) {
      statusEl.textContent = configured ? 'Terhubung' : 'Belum dikonfigurasi';
    }
  }

  async function saveSupabaseConfig() {
    const url = getFieldValue('supabaseUrl');
    const anonKey = getFieldValue('supabaseAnonKey');

    if (!url || !anonKey) {
      showToast('URL dan Anon Key tidak boleh kosong.', 'warning');
      return;
    }

    SupabaseManager.saveConfig(url, anonKey);
    
    // Test connection
    const result = await SupabaseManager.testConnection();
    if (result.ok) {
      showToast('Supabase terhubung! ' + result.message, 'success');
    } else {
      showToast('Gagal terhubung: ' + result.message, 'error');
    }

    updateSupabaseStatus();
  }

  async function testSupabaseConnection() {
    const result = await SupabaseManager.testConnection();
    if (result.ok) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  }

  /* ── Chat Page ───────────────────────────────────── */

  async function initChatPage() {
    // Update model badge
    const badge = document.getElementById('chatModelBadge');
    if (badge) {
      const provider = await AI.getActiveProvider();
      badge.textContent = provider.name;
    }
    // Initialize chat module
    if (typeof Chat !== 'undefined') {
      Chat.init();
    }
  }

  /* ── Toast ───────────────────────────────────────── */

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ── Helpers ─────────────────────────────────────── */

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '-';
    }
  }

  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(99, 102, 241, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getBadgeClass(type) {
    const map = {
      'modul-ajar': 'badge-indigo',
      'rpp': 'badge-violet',
      'lkpd': 'badge-cyan',
      'soal': 'badge-amber',
      'silabus': 'badge-emerald',
      'capaian-pembelajaran': 'badge-indigo',
      'tujuan-pembelajaran': 'badge-amber',
      'deep-learning': 'badge-cyan'
    };
    return map[type] || 'badge-indigo';
  }

  function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  function getFieldValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* ── Public API ──────────────────────────────────── */

  return {
    init,
    handleGenerate,
    handleDownload,
    handleCopy,
    viewHistoryItem,
    downloadHistoryItem,
    deleteHistoryItem,
    clearAllHistory,
    saveApiKey,
    testApiConnection,
    saveProfile,
    onProviderChange,
    saveSupabaseConfig,
    testSupabaseConnection,
    navigate: (page) => { window.location.hash = page; },
    showToast
  };
})();

// Initialize on DOM ready — check auth first (async)
document.addEventListener('DOMContentLoaded', async () => {
  // Check if Supabase is configured
  if (!SupabaseManager.isConfigured()) {
    // Show login screen — user needs to configure Supabase first via settings
    // But we still show the login screen (admin can configure after first login)
    console.log('[App] Supabase not configured yet.');
  }

  const hasSession = await Auth.checkSession();
  if (hasSession) {
    await App.init();
  }
  // If not logged in, login screen is shown; App.init() called after login
});
