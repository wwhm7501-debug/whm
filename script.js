// ===== CONFIGURATION =====
let CONFIG = {
    appName: ',,',
    version: '1.0.0',
    defaultTheme: 'dark',
    features: {
        music: true,
        camera: true,
        settings: true
    },
    security: {
        settingsPassword: "54321",
        passwordKey: "angeltia_settings_access",
        configKey: "angeltia_config"
    },
    admin: {
        storageKey: "angeltia_global_settings"
    }
};

// ===== AUTO-SAVE SYSTEM =====
function initAutoSave() {
    // مراقبة كل التغييرات تلقائياً
    if (elements.settings.nameInput) {
        elements.settings.nameInput.addEventListener('input', function() {
            state.profile.name = this.value;
            autoSaveAllSettings();
        });
    }
    
    if (elements.settings.bioInput) {
        elements.settings.bioInput.addEventListener('input', function() {
            state.profile.bio = this.value;
            autoSaveAllSettings();
        });
    }
    
    // مراقبة تغييرات الألوان
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            state.settings.theme = theme;
            applyTheme(theme);
            autoSaveAllSettings();
        });
    });
}

function autoSaveAllSettings() {
    // حفظ كل شيء في مصدر واحد للكل
    const allSettings = {
        profile: {
            name: state.profile.name,
            bio: state.profile.bio,
            avatar: state.profile.avatar,
            views: state.profile.views,
            socialLinks: state.profile.socialLinks
        },
        tracks: state.tracks,
        photos: state.photos,
        settings: {
            theme: state.settings.theme,
            autoPlay: state.settings.autoPlay,
            savePhotos: state.settings.savePhotos
        },
        lastUpdated: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(CONFIG.admin.storageKey, JSON.stringify(allSettings));
        showNotification('تم الحفظ التلقائي للجميع! 💾', 'success', 1500);
    } catch (error) {
        console.error('خطأ في الحفظ التلقائي:', error);
    }
    
    updateUI();
}

// ===== PASSWORD PROTECTION =====
function changeSettingsPassword() {
    if (!isAdmin()) {
        showNotification('يجب أن تكون مسؤولاً لتغيير كلمة المرور', 'error');
        return;
    }
    
    const currentPass = prompt("أدخل كلمة المرور الحالية:");
    if (currentPass !== CONFIG.security.settingsPassword) {
        showNotification('كلمة المرور الحالية غير صحيحة', 'error');
        return;
    }
    
    const newPass = prompt("أدخل كلمة المرور الجديدة:");
    if (newPass && newPass.length >= 4) {
        CONFIG.security.settingsPassword = newPass;
        saveConfigToStorage();
        showNotification('تم تغيير كلمة المرور بنجاح! 🔑', 'success');
        
        localStorage.removeItem(CONFIG.security.passwordKey);
        localStorage.removeItem('angeltia_admin');
        
        setTimeout(() => {
            showSection('settings');
        }, 1000);
    } else {
        showNotification('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
    }
}

// ===== حفظ وإعادة تحميل الإعدادات =====
function saveConfigToStorage() {
    try {
        localStorage.setItem(CONFIG.security.configKey, JSON.stringify({
            settingsPassword: CONFIG.security.settingsPassword,
            lastUpdated: new Date().toISOString()
        }));
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
    }
}

function loadConfigFromStorage() {
    try {
        const savedConfig = localStorage.getItem(CONFIG.security.configKey);
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.settingsPassword) {
                CONFIG.security.settingsPassword = config.settingsPassword;
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

// ===== CORE FUNCTIONS =====
function initApp() {
    console.log(`🎵 ${CONFIG.appName} v${CONFIG.version} initialized`);
    loadConfigFromStorage();
    initializeElements();
    loadState();
    initMusic();
    initEvents();
    initAutoSave(); // نظام الحفظ التلقائي
    updateAdminUI();
    updateUI();
    showNotification('مرحباً بك ', 'success');
}

// ===== تحسين verifyPassword =====
function verifyPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput ? passwordInput.value : '';
    
    loadConfigFromStorage();
    
    if (password === CONFIG.security.settingsPassword) {
        localStorage.setItem(CONFIG.security.passwordKey, 'true');
        closePasswordModal();
        showNotification('تم الوصول إلى الإعدادات بنجاح! ✅', 'success');
        
        if (!isAdmin()) {
            localStorage.setItem('angeltia_admin', 'true');
            updateAdminUI();
        }
        
        setTimeout(() => showSection('settings'), 500);
    } else {
        showNotification('كلمة المرور غير صحيحة', 'error');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// ===== تحسين showPasswordModal =====
function showPasswordModal() {
    if (document.querySelector('.password-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'password-modal';
    modal.innerHTML = `
        <div class="password-content glass-card">
            <h3><i class="fas fa-lock"></i> مطلوب كلمة المرور</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">أدخل كلمة المرور للوصول إلى الإعدادات</p>
            <input type="password" class="password-input" id="passwordInput" placeholder="أدخل كلمة المرور..." autofocus>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button class="action-btn secondary" onclick="closePasswordModal()" style="flex: 1;">
                    <i class="fas fa-times"></i>
                    إلغاء
                </button>
                <button class="action-btn primary" onclick="verifyPassword()" style="flex: 1;">
                    <i class="fas fa-check"></i>
                    تأكيد
                </button>
            </div>
            
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    verifyPassword();
                }
            });
        }
    }, 100);
}



// ===== STATE MANAGEMENT =====
let state = {
    audio: null,
    isPlaying: false,
    currentTrack: 0,
    volume: 0.5,
    tracks: [
        {
            title: 'Midnight Dreams',
            artist: 'Angeltia',
            src: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
            cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
        
            
    ],
    cameraStream: null,
    currentCamera: 'user',
    photos: [],
    profile: {
        name: '=--=',
        bio: ',,',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        views: 1250,
        socialLinks: []
    },
    settings: {
        theme: 'dark',
        autoPlay: true,
        savePhotos: true
    }
};

// ===== DOM ELEMENTS =====
let elements = {};

function initializeElements() {
    elements = {
        sections: {
            profile: document.getElementById('profile'),
            music: document.getElementById('music'),
            camera: document.getElementById('camera'),
            settings: document.getElementById('settings')
        },
        profile: {
            name: document.getElementById('profileName'),
            bio: document.getElementById('profileBio'),
            avatar: document.getElementById('profileAvatar'),
            views: document.getElementById('viewCount')
        },
        music: {
            cover: document.getElementById('trackCover'),
            title: document.getElementById('trackTitle'),
            artist: document.getElementById('trackArtist'),
            progress: document.getElementById('progress'),
            progressBar: document.getElementById('progressBar'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            playIcon: document.getElementById('playIcon'),
            volumeSlider: document.getElementById('volumeSlider')
        },
        camera: {
            feed: document.getElementById('cameraFeed'),
            canvas: document.getElementById('photoCanvas'),
            gallery: document.getElementById('photoGallery'),
            galleryItems: document.getElementById('galleryItems')
        },
        settings: {
            nameInput: document.getElementById('nameInput'),
            bioInput: document.getElementById('bioInput'),
            avatarInput: document.getElementById('avatarInput'),
            musicInput: document.getElementById('musicInput'),
            coverInput: document.getElementById('coverInput')
        },
        social: {
            platform: document.getElementById('socialPlatform'),
            url: document.getElementById('socialUrl'),
            links: document.getElementById('socialLinks')
        },
        notification: document.getElementById('notification'),
        notificationText: document.getElementById('notificationText')
    };
}

// ===== PASSWORD PROTECTION =====
function checkSettingsAccess() {
    const hasAccess = localStorage.getItem(CONFIG.security.passwordKey) === 'true';
    
    if (!hasAccess) {
        showPasswordModal();
        return false;
    }
    return true;
}

function closePasswordModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) {
        modal.remove();
    }
    showSection('profile');
}

function logoutAdmin() {
    localStorage.removeItem('angeltia_admin');
    localStorage.removeItem(CONFIG.security.passwordKey);
    showNotification('تم تسجيل الخروج وإزالة الصلاحيات', 'info');
    updateAdminUI();
    showSection('profile');
}

// ===== ADMIN SYSTEM =====
function isAdmin() {
    return localStorage.getItem('angeltia_admin') === 'true';
}

function loginAsAdmin() {
    const password = prompt("🔐 أدخل كلمة المرور للإدارة:");
    if (password === CONFIG.security.settingsPassword) {
        localStorage.setItem('angeltia_admin', 'true');
        localStorage.setItem(CONFIG.security.passwordKey, 'true');
        showNotification('تم الدخول كمسؤول! 👑', 'success');
        updateAdminUI();
        showSection('settings');
        return true;
    } else {
        showNotification('كلمة المرور غير صحيحة', 'error');
        return false;
    }
}

// ===== CORE FUNCTIONS =====
function loadState() {
    // جلب كل الإعدادات من مصدر واحد للكل
    const allSettings = localStorage.getItem(CONFIG.admin.storageKey);
    if (allSettings) {
        try {
            const saved = JSON.parse(allSettings);
            
            // تطبيق كل الإعدادات من مصدر واحد
            if (saved.profile) {
                state.profile.name = saved.profile.name || state.profile.name;
                state.profile.bio = saved.profile.bio || state.profile.bio;
                state.profile.avatar = saved.profile.avatar || state.profile.avatar;
                state.profile.views = saved.profile.views || state.profile.views;
                state.profile.socialLinks = saved.profile.socialLinks || state.profile.socialLinks;
            }
            
            state.tracks = saved.tracks || state.tracks;
            state.photos = saved.photos || state.photos;
            
            if (saved.settings) {
                state.settings.theme = saved.settings.theme || state.settings.theme;
                state.settings.autoPlay = saved.settings.autoPlay !== undefined ? saved.settings.autoPlay : state.settings.autoPlay;
                state.settings.savePhotos = saved.settings.savePhotos !== undefined ? saved.settings.savePhotos : state.settings.savePhotos;
            }
            
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات:', error);
        }
    }
    
    applyTheme(state.settings.theme);
}

function applyTheme(theme) {
    const actualTheme = theme === 'auto' ? 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
        theme;
    
    document.documentElement.setAttribute('data-theme', actualTheme);
    state.settings.theme = theme;
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateUI() {
    if (elements.profile.name) elements.profile.name.textContent = state.profile.name;
    if (elements.profile.bio) elements.profile.bio.textContent = state.profile.bio;
    if (elements.profile.avatar) elements.profile.avatar.src = state.profile.avatar;
    if (elements.profile.views) elements.profile.views.textContent = formatNumber(state.profile.views);
    
    if (elements.settings.nameInput) elements.settings.nameInput.value = state.profile.name;
    if (elements.settings.bioInput) elements.settings.bioInput.value = state.profile.bio;
    
    updateMusicUI();
    updateGallery();
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ===== NAVIGATION =====
function showSection(sectionId) {
    if (sectionId === 'settings') {
        if (!checkSettingsAccess()) {
            return;
        }
    }
    
    Object.values(elements.sections).forEach(section => {
        if (section) section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (elements.sections[sectionId]) {
        elements.sections[sectionId].classList.add('active');
        
        const activeNavBtn = document.querySelector(`.nav-btn[onclick="showSection('${sectionId}')"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
    }
    
    if (sectionId !== 'camera' && state.cameraStream) {
        stopCamera();
    }
    
    if (sectionId === 'camera' && !state.cameraStream) {
        openCamera();
    }
}

// ===== MUSIC PLAYER =====
function initMusic() {
    state.audio = new Audio();
    state.audio.volume = state.volume;
    loadTrack(state.currentTrack);
    
    state.audio.addEventListener('loadedmetadata', updateMusicTime);
    state.audio.addEventListener('timeupdate', updateMusicProgress);
    state.audio.addEventListener('ended', nextTrack);
    
    if (elements.music.volumeSlider) {
        elements.music.volumeSlider.addEventListener('input', setVolume);
    }
}

function loadTrack(index) {
    if (state.tracks[index]) {
        const track = state.tracks[index];
        state.currentTrack = index;
        state.audio.src = track.src;
        
        if (elements.music.cover) elements.music.cover.src = track.cover;
        if (elements.music.title) elements.music.title.textContent = track.title;
        if (elements.music.artist) elements.music.artist.textContent = track.artist;
        if (elements.music.progress) elements.music.progress.style.width = '0%';
        if (elements.music.currentTime) elements.music.currentTime.textContent = '0:00';
        
        if (state.isPlaying) {
            state.audio.play().catch(error => {
                console.error('خطأ في التشغيل:', error);
            });
        }
    }
}

function togglePlay() {
    if (!state.audio.src) return;
    
    if (state.isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    if (!state.audio.src) return;
    
    state.audio.play().then(() => {
        state.isPlaying = true;
        if (elements.music.playIcon) elements.music.playIcon.className = 'fas fa-pause';
        increaseViews();
        autoSaveAllSettings(); // حفظ تلقائي
    }).catch(error => {
        console.error('خطأ في التشغيل:', error);
        state.isPlaying = false;
        if (elements.music.playIcon) elements.music.playIcon.className = 'fas fa-play';
    });
}

function pauseMusic() {
    state.audio.pause();
    state.isPlaying = false;
    if (elements.music.playIcon) elements.music.playIcon.className = 'fas fa-play';
}

function nextTrack() {
    const nextIndex = (state.currentTrack + 1) % state.tracks.length;
    loadTrack(nextIndex);
    if (state.isPlaying) playMusic();
}

function previousTrack() {
    const prevIndex = (state.currentTrack - 1 + state.tracks.length) % state.tracks.length;
    loadTrack(prevIndex);
    if (state.isPlaying) playMusic();
}

function setVolume() {
    if (!elements.music.volumeSlider) return;
    const volume = elements.music.volumeSlider.value / 100;
    state.volume = volume;
    state.audio.volume = volume;
}

function updateMusicProgress() {
    if (!state.audio.duration || !elements.music.progress || !elements.music.currentTime) return;
    
    const percent = (state.audio.currentTime / state.audio.duration) * 100;
    elements.music.progress.style.width = percent + '%';
    elements.music.currentTime.textContent = formatTime(state.audio.currentTime);
}

function updateMusicTime() {
    if (elements.music.duration) {
        elements.music.duration.textContent = formatTime(state.audio.duration);
    }
}

function updateMusicUI() {
    if (state.tracks[state.currentTrack]) {
        const track = state.tracks[state.currentTrack];
        if (elements.music.cover) elements.music.cover.src = track.cover;
        if (elements.music.title) elements.music.title.textContent = track.title;
        if (elements.music.artist) elements.music.artist.textContent = track.artist;
    }
    if (elements.music.volumeSlider) elements.music.volumeSlider.value = state.volume * 100;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== رفع الصور والموسيقى للكل =====
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.profile.avatar = e.target.result;
            updateUI();
            autoSaveAllSettings(); // حفظ تلقائي للكل
            showNotification('تم تغيير صورة البروفايل للجميع! 📸', 'success');
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('الرجاء اختيار ملف صورة صحيح', 'error');
    }
}

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (state.tracks[state.currentTrack]) {
                state.tracks[state.currentTrack].cover = e.target.result;
                updateMusicUI();
                autoSaveAllSettings(); // حفظ تلقائي للكل
                showNotification('تم تغيير صورة الأغنية للجميع! 🎵', 'success');
            }
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('الرجاء اختيار ملف صورة صحيح', 'error');
    }
}

function handleMusicUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newTrack = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'مستخدم',
                src: e.target.result,
                cover: state.tracks[0]?.cover || 'https://cdn.discordapp.com/attachments/1417860725552185361/1434070255252013056/image.jpg?ex=6906fd80&is=6905ac00&hm=cfeb7518ce35ea0b842693b02fa8a386017011a4dcafa73b4cb7298605c2e957&'
            };
            state.tracks.push(newTrack);
            autoSaveAllSettings(); // حفظ تلقائي للكل
            showNotification('تم إضافة الأغنية للجميع! 🎵', 'success');
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('الرجاء اختيار ملف صوتي صحيح', 'error');
    }
}

function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const ownerBadge = document.getElementById('ownerBadge');
    
    if (isAdmin()) {
        adminElements.forEach(el => {
            if (el) el.style.display = 'block';
        });
        if (ownerBadge) ownerBadge.style.display = 'inline-block';
    } else {
        adminElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (ownerBadge) ownerBadge.style.display = 'none';
    }
}

// ===== SOCIAL MEDIA =====
function showSocialLinks() {
    updateSocialLinksUI();
    const modal = document.getElementById('socialModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSocialModal() {
    const modal = document.getElementById('socialModal');
    if (modal) modal.classList.add('hidden');
}

function updateSocialLinksUI() {
    const socialLinksContainer = document.getElementById('socialLinks');
    if (!socialLinksContainer) return;
    
    socialLinksContainer.innerHTML = '';
    
    if (state.profile.socialLinks.length === 0) {
        socialLinksContainer.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 2rem;">لا توجد روابط مضافة</p>';
        return;
    }
    
    state.profile.socialLinks.forEach((link, index) => {
        const linkElement = document.createElement('div');
        linkElement.className = 'social-link-item';
        linkElement.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin: 0.5rem 0; background: var(--glass-bg); border-radius: 12px; border: 1px solid var(--glass-border);';
        
        linkElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                <i class="${getSocialIcon(link.platform)}" style="color: ${getSocialColor(link.platform)}; font-size: 1.5rem;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: var(--text-primary);">${getPlatformName(link.platform)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis;">${link.url}</div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="social-btn" onclick="openSocialLink('${link.url}')" style="background: var(--accent-primary); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-external-link-alt"></i> فتح
                </button>
                <button class="social-btn delete-btn" onclick="deleteSocialLink(${index})" style="background: var(--danger); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; font-size: 0.8rem;">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        socialLinksContainer.appendChild(linkElement);
    });
}

function addSocialLink() {
    const platform = elements.social.platform ? elements.social.platform.value : 'other';
    const urlInput = elements.social.url;
    const url = urlInput ? urlInput.value.trim() : '';
    
    if (!url) {
        showNotification('الرجاء إدخال الرابط', 'error');
        return;
    }
    
    if (!isValidUrl(url)) {
        showNotification('الرجاء إدخال رابط صحيح يبدأ بـ https://', 'error');
        return;
    }
    
    state.profile.socialLinks.push({ platform: platform, url: url, id: Date.now() });
    
    if (urlInput) urlInput.value = '';
    updateSocialLinksUI();
    autoSaveAllSettings(); // حفظ تلقائي للكل
    showNotification('تم إضافة الرابط للجميع! ✅', 'success');
}

function deleteSocialLink(index) {
    if (confirm('هل تريد حذف هذا الرابط؟')) {
        state.profile.socialLinks.splice(index, 1);
        updateSocialLinksUI();
        autoSaveAllSettings(); // حفظ تلقائي للكل
        showNotification('تم حذف الرابط للجميع! 🗑️', 'success');
    }
}

function openSocialLink(url) {
    window.open(url, '_blank');
}

function getSocialIcon(platform) {
    const icons = {
        instagram: 'fab fa-instagram',
        twitter: 'fab fa-twitter',
        youtube: 'fab fa-youtube',
        tiktok: 'fab fa-tiktok',
        snapchat: 'fab fa-snapchat-ghost',
        website: 'fas fa-globe',
        other: 'fas fa-link'
    };
    return icons[platform] || 'fas fa-link';
}

function getSocialColor(platform) {
    const colors = {
        instagram: '#E4405F',
        twitter: '#1DA1F2',
        youtube: '#FF0000',
        tiktok: '#000000',
        snapchat: '#FFFC00',
        website: 'var(--accent-primary)',
        other: 'var(--text-secondary)'
    };
    return colors[platform] || 'var(--text-primary)';
}

function getPlatformName(platform) {
    const names = {
        instagram: 'انستغرام',
        twitter: 'تويتر', 
        youtube: 'يوتيوب',
        tiktok: 'تيك توك',
        snapchat: 'سناب شات',
        website: 'موقع ويب',
        other: 'رابط'
    };
    return names[platform] || 'رابط';
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (_) {
        return false;
    }
}

// ===== CAMERA =====
async function openCamera() {
    try {
        const constraints = { 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 }, 
                facingMode: state.currentCamera 
            } 
        };
        state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (elements.camera.feed) {
            elements.camera.feed.srcObject = state.cameraStream;
        }
        showNotification('الكاميرا جاهزة! 📸', 'success');
    } catch (error) {
        console.error('خطأ في الكاميرا:', error);
        showNotification('تعذر الوصول للكاميرا', 'error');
    }
}

function capturePhoto() {
    if (!state.cameraStream || !elements.camera.feed || !elements.camera.canvas) return;
    
    const video = elements.camera.feed;
    const canvas = elements.camera.canvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/png');
    state.photos.push({ 
        data: photoData, 
        timestamp: new Date().toLocaleString('ar-SA'), 
        id: Date.now() 
    });
    
    increaseViews();
    updateGallery();
    autoSaveAllSettings(); // حفظ تلقائي للكل
    showNotification('تم التقاط الصورة للجميع! ✅', 'success');
}

async function switchCamera() {
    if (!state.cameraStream) return;
    
    stopCamera();
    state.currentCamera = state.currentCamera === 'user' ? 'environment' : 'user';
    await openCamera();
}

function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
    }
}

function toggleGallery() {
    if (elements.camera.gallery) {
        elements.camera.gallery.classList.toggle('hidden');
    }
}

function updateGallery() {
    if (!elements.camera.galleryItems) return;
    
    elements.camera.galleryItems.innerHTML = '';
    
    state.photos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.data;
        img.alt = `صورة ${index + 1}`;
        img.className = 'gallery-item';
        img.onclick = () => viewPhoto(photo);
        elements.camera.galleryItems.appendChild(img);
    });
}

function viewPhoto(photo) {
    const link = document.createElement('a');
    link.href = photo.data;
    link.download = `angeltia_photo_${photo.id}.png`;
    link.click();
    showNotification('جاري تحميل الصورة...', 'info');
}

// ===== THEME SYSTEM =====
function changeTheme(theme) {
    applyTheme(theme);
    autoSaveAllSettings(); // حفظ تلقائي للكل
    showNotification(`تم التغيير إلى الوضع ${getThemeName(theme)} للجميع! 🌍`, 'success');
}

function getThemeName(theme) {
    const names = {
        dark: 'الداكن',
        light: 'الفاتح', 
        auto: 'التلقائي'
    };
    return names[theme] || theme;
}

// ===== PLAYLIST =====
function showPlaylist() {
    let playlistHTML = '<div class="playlist-modal glass-card" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; padding: 2rem; max-width: 500px; width: 90%;">';
    playlistHTML += '<div class="playlist-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">';
    playlistHTML += '<h3>قائمة التشغيل</h3>';
    playlistHTML += '<button class="close-btn" onclick="closePlaylist()"><i class="fas fa-times"></i></button>';
    playlistHTML += '</div>';
    playlistHTML += '<div class="playlist-items">';
    
    state.tracks.forEach((track, index) => {
        const isActive = index === state.currentTrack;
        playlistHTML += `<div class="playlist-item ${isActive ? 'active' : ''}" style="padding: 1rem; margin: 0.5rem 0; background: ${isActive ? 'var(--accent-glow)' : 'transparent'}; border-radius: 12px; cursor: pointer; transition: var(--transition-fast); display: flex; justify-content: space-between; align-items: center;">`;
        playlistHTML += `<div onclick="playFromPlaylist(${index})" style="flex: 1;">`;
        playlistHTML += `<strong>${track.title}</strong>`;
        playlistHTML += `<br><span style="color: var(--text-secondary); font-size: 0.9rem;">${track.artist}</span>`;
        playlistHTML += `</div>`;
        
        if (track.src.startsWith('data:')) {
            playlistHTML += `<button class="delete-btn" onclick="deleteTrack(${index})" style="background: var(--danger); color: white; border: none; border-radius: 8px; padding: 0.5rem; cursor: pointer; margin-right: 1rem;">`;
            playlistHTML += `<i class="fas fa-trash"></i>`;
            playlistHTML += `</button>`;
        }
        playlistHTML += '</div>';
    });
    
    playlistHTML += '</div></div>';
    
    const modal = document.createElement('div');
    modal.id = 'playlistModal';
    modal.innerHTML = playlistHTML;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    
    document.body.appendChild(modal);
}

function closePlaylist() {
    const modal = document.getElementById('playlistModal');
    if (modal) modal.remove();
}

function playFromPlaylist(index) {
    loadTrack(index);
    if (!state.isPlaying) playMusic();
    closePlaylist();
}

function deleteTrack(index) {
    if (confirm(`هل تريد حذف "${state.tracks[index].title}"؟`)) {
        state.tracks.splice(index, 1);
        
        if (state.currentTrack >= state.tracks.length) {
            state.currentTrack = 0;
        }
        
        if (state.tracks.length === 0) {
            pauseMusic();
            state.audio.src = '';
            updateMusicUI();
        } else {
            loadTrack(state.currentTrack);
        }
        
        closePlaylist();
        autoSaveAllSettings(); // حفظ تلقائي للكل
        showNotification('تم حذف الأغنية للجميع! 🗑️', 'success');
    }
}

// ===== UTILITY =====
function increaseViews() {
    state.profile.views++;
    updateUI();
    autoSaveAllSettings(); // حفظ تلقائي للكل
}

function showNotification(message, type = 'info', duration = 3000) {
    if (!elements.notification || !elements.notificationText) return;
    
    elements.notificationText.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.remove('hidden');
    
    setTimeout(() => {
        if (elements.notification) {
            elements.notification.classList.add('hidden');
        }
    }, duration);
}

// ===== EVENTS =====
function initEvents() {
    // إضافة event listeners للملفات
    if (elements.settings.avatarInput) {
        elements.settings.avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    if (elements.settings.coverInput) {
        elements.settings.coverInput.addEventListener('change', handleCoverUpload);
    }
    
    if (elements.settings.musicInput) {
        elements.settings.musicInput.addEventListener('change', handleMusicUpload);
    }
    
    if (elements.music.progressBar) {
        elements.music.progressBar.addEventListener('click', (e) => {
            if (!state.audio.duration) return;
            const rect = elements.music.progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            state.audio.currentTime = percent * state.audio.duration;
        });
    }
    
    // زيادة المشاهدات عند التفاعل
    document.addEventListener('click', () => {
        if (Math.random() > 0.9) increaseViews();
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', initApp);

window.addEventListener('beforeunload', () => {
    if (state.cameraStream) stopCamera();
    if (state.isPlaying) pauseMusic();
});

console.log('🚀 Angeltia Portfolio Loaded Successfully!');

