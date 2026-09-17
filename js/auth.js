/**
 * Auth Module — Supabase-based authentication
 * Manages user registration, login, logout, password reset, and session
 */
const Auth = (() => {
  let _currentUser = null;

  /* ── Session ─────────────────────────────────────── */

  function isLoggedIn() {
    return !!_currentUser;
  }

  function getCurrentUser() {
    return _currentUser;
  }

  /* ── Tab Switching ───────────────────────────────── */

  function switchTab(tab) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const formForgot = document.getElementById('formForgotPassword');

    // Hide forgot password form when switching tabs
    if (formForgot) formForgot.style.display = 'none';

    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = '';
      formRegister.style.display = 'none';
    } else {
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
      formLogin.style.display = 'none';
      formRegister.style.display = '';
    }
  }

  /* ── Show Forgot Password Form ──────────────────── */

  function showForgotPassword() {
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const formForgot = document.getElementById('formForgotPassword');

    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'none';
    if (formForgot) formForgot.style.display = '';

    // Deactivate tabs
    document.getElementById('tabLogin')?.classList.remove('active');
    document.getElementById('tabRegister')?.classList.remove('active');
  }

  function hideForgotPassword() {
    const formForgot = document.getElementById('formForgotPassword');
    if (formForgot) formForgot.style.display = 'none';
    switchTab('login');
  }

  /* ── Login ───────────────────────────────────────── */

  async function handleLogin(e) {
    e.preventDefault();
    console.log('[Auth] handleLogin called');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showLoginError('Mohon isi semua field.');
      return;
    }

    // Check Supabase is configured
    const client = SupabaseManager.getClient();
    console.log('[Auth] Supabase client:', client ? 'OK' : 'NULL');
    if (!client) {
      showLoginError('Supabase belum dikonfigurasi. Hubungi administrator.');
      return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#formLogin .login-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Memproses...';
    }

    try {
      console.log('[Auth] Signing in with:', email);
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      console.log('[Auth] signIn result - data:', data, 'error:', error);

      if (error) {
        console.error('[Auth] Login error:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          showLoginError('Email atau password salah. Silakan coba lagi.');
        } else if (error.message.includes('Email not confirmed')) {
          showLoginError('Email belum dikonfirmasi. Periksa inbox email Anda.');
        } else {
          showLoginError('Login error: ' + error.message);
        }
        return;
      }

      // Success — load profile and enter app
      const user = data.user;
      const profile = await loadProfile(user);
      _currentUser = {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || 'Guru',
        school: profile?.school || user.user_metadata?.school || ''
      };

      enterApp(_currentUser);
    } catch (err) {
      console.error('[Auth] Login catch error:', err);
      showLoginError('Gagal terhubung ke server: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Masuk';
      }
    }
  }

  /* ── Register ────────────────────────────────────── */

  async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const school = document.getElementById('regSchool').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
      showLoginError('Mohon isi semua field yang wajib.');
      return;
    }

    if (password.length < 6) {
      showLoginError('Password minimal 6 karakter.');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showLoginError('Format email tidak valid.');
      return;
    }

    const client = SupabaseManager.getClient();
    if (!client) {
      showLoginError('Supabase belum dikonfigurasi. Hubungi administrator.');
      return;
    }

    // Show loading
    const submitBtn = document.querySelector('#formRegister .login-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Mendaftar...';
    }

    try {
      console.log('[Auth] Signing up:', email, name);
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { name, school }
        }
      });

      console.log('[Auth] signUp result - data:', data, 'error:', error);

      if (error) {
        console.error('[Auth] Register error FULL:', JSON.stringify(error));
        const errMsg = error.message || error.msg || error.error_description || JSON.stringify(error);
        const errStatus = error.status || error.statusCode || '';
        console.error('[Auth] Register error details - status:', errStatus, 'msg:', errMsg);
        if (errMsg.includes('already registered') || errMsg.includes('already been registered')) {
          showLoginError('Email sudah terdaftar. Silakan masuk.');
        } else if (errMsg.includes('rate') || errMsg.includes('limit')) {
          showLoginError('Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
        } else if (errMsg.includes('not authorized') || errMsg.includes('Signups not allowed')) {
          showLoginError('Pendaftaran tidak diizinkan. Periksa pengaturan Auth di Supabase.');
        } else {
          showLoginError('Register error [' + errStatus + ']: ' + errMsg);
        }
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('[Auth] Email confirmation required');
        // Try to create profile anyway
        await createProfile(data.user.id, name, school);
        showLoginError('Pendaftaran berhasil! Periksa email Anda untuk konfirmasi.', 'success');
        switchTab('login');
        return;
      }

      // Auto-login after signup (if no email confirmation required)
      if (data.user && data.session) {
        console.log('[Auth] Auto-login after signup, user:', data.user.id);
        // Create profile in database
        await createProfile(data.user.id, name, school);
        
        _currentUser = {
          id: data.user.id,
          email: data.user.email,
          name: name,
          school: school
        };
        enterApp(_currentUser);
      }
    } catch (err) {
      showLoginError('Gagal mendaftar: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Daftar & Masuk';
      }
    }
  }

  /* ── Forgot Password ─────────────────────────────── */

  async function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim();

    if (!email) {
      showLoginError('Mohon masukkan email Anda.');
      return;
    }

    const client = SupabaseManager.getClient();
    if (!client) {
      showLoginError('Supabase belum dikonfigurasi.');
      return;
    }

    const submitBtn = document.querySelector('#formForgotPassword .login-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Mengirim...';
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });

      if (error) {
        showLoginError(error.message);
        return;
      }

      showLoginError('Link reset password telah dikirim ke email Anda. Periksa inbox Anda.', 'success');
      setTimeout(() => hideForgotPassword(), 3000);
    } catch (err) {
      showLoginError('Gagal mengirim email: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Kirim Link Reset';
      }
    }
  }

  /* ── Load Profile from Supabase ──────────────────── */

  async function loadProfile(user) {
    const client = SupabaseManager.getClient();
    if (!client || !user) return null;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('[Auth] Profile load error:', error.message);
        // If profile not found, try to create it
        if (error.code === 'PGRST116') {
          console.log('[Auth] Profile not found, creating...');
          return await createProfile(user.id, user.user_metadata?.name || '', user.user_metadata?.school || '');
        }
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[Auth] Profile load exception:', e);
      return null;
    }
  }

  /* ── Create Profile in Supabase ─────────────────── */

  async function createProfile(userId, name, school) {
    const client = SupabaseManager.getClient();
    if (!client) return null;

    try {
      console.log('[Auth] Creating profile for user:', userId);
      const { data, error } = await client
        .from('profiles')
        .upsert({
          id: userId,
          name: name || '',
          school: school || '',
          api_keys: {},
          active_provider: 'gemini-2.5-flash',
          tahun_ajaran: '2025/2026'
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('[Auth] Create profile error:', error.message);
        return null;
      }

      console.log('[Auth] Profile created successfully');
      return data;
    } catch (e) {
      console.warn('[Auth] Create profile exception:', e);
      return null;
    }
  }

  /* ── Logout ──────────────────────────────────────── */

  async function logout() {
    const client = SupabaseManager.getClient();
    if (client) {
      await client.auth.signOut();
    }
    _currentUser = null;
    showLoginScreen();
  }

  /* ── UI Transitions ──────────────────────────────── */

  function enterApp(user) {
    const loginScreen = document.getElementById('loginScreen');
    const appLayout = document.getElementById('appLayout');

    // Animate out login
    loginScreen.classList.add('login-exit');

    setTimeout(() => {
      loginScreen.style.display = 'none';
      loginScreen.classList.remove('login-exit');
      appLayout.style.display = '';

      // Update sidebar user info
      updateSidebarUser(user || _currentUser);

      // Init the app
      if (typeof App !== 'undefined' && App.init) {
        App.init();
      }
    }, 500);
  }

  function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const appLayout = document.getElementById('appLayout');

    appLayout.style.display = 'none';
    loginScreen.style.display = '';

    // Reset forms
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const formForgot = document.getElementById('formForgotPassword');
    if (formLogin) formLogin.reset();
    if (formRegister) formRegister.reset();
    if (formForgot) { formForgot.reset(); formForgot.style.display = 'none'; }
    switchTab('login');
  }

  function updateSidebarUser(user) {
    if (!user) return;

    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');

    if (avatarEl) {
      avatarEl.textContent = (user.name || 'G').charAt(0).toUpperCase();
    }
    if (nameEl) {
      nameEl.textContent = user.name || 'Guru';
    }
  }

  function showLoginError(msg, type = 'error') {
    let errorEl = document.querySelector('.login-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'login-error';
      const card = document.querySelector('.login-card');
      const tabs = document.querySelector('.login-tabs');
      if (card && tabs) {
        tabs.after(errorEl);
      }
    }

    errorEl.textContent = msg;
    errorEl.style.display = 'block';

    // Style based on type
    if (type === 'success') {
      errorEl.style.background = 'rgba(16, 185, 129, 0.12)';
      errorEl.style.color = '#10B981';
      errorEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
      errorEl.style.background = '';
      errorEl.style.color = '';
      errorEl.style.borderColor = '';
    }

    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  /* ── Boot — Check existing Supabase session ──────── */

  async function checkSession() {
    const client = SupabaseManager.getClient();
    if (!client) return false;

    try {
      const { data: { session }, error } = await client.auth.getSession();

      if (error || !session) return false;

      const user = session.user;
      const profile = await loadProfile(user);

      _currentUser = {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || 'Guru',
        school: profile?.school || user.user_metadata?.school || ''
      };

      // Skip login screen, show app directly
      const loginScreen = document.getElementById('loginScreen');
      const appLayout = document.getElementById('appLayout');
      if (loginScreen) loginScreen.style.display = 'none';
      if (appLayout) appLayout.style.display = '';
      updateSidebarUser(_currentUser);

      return true;
    } catch (e) {
      console.error('[Auth] checkSession error:', e);
      return false;
    }
  }

  /* ── Auth State Change Listener ──────────────────── */

  function setupAuthListener() {
    const client = SupabaseManager.getClient();
    if (!client) return;

    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        _currentUser = null;
        showLoginScreen();
      } else if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link — show a prompt
        const newPassword = prompt('Masukkan password baru Anda (minimal 6 karakter):');
        if (newPassword && newPassword.length >= 6) {
          const { error } = await client.auth.updateUser({ password: newPassword });
          if (error) {
            alert('Gagal mengubah password: ' + error.message);
          } else {
            alert('Password berhasil diubah! Silakan login dengan password baru.');
          }
        }
      }
    });
  }

  /* ── Public API ──────────────────────────────────── */

  return {
    switchTab,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    showForgotPassword,
    hideForgotPassword,
    logout,
    isLoggedIn,
    getCurrentUser,
    checkSession,
    updateSidebarUser,
    setupAuthListener
  };
})();
