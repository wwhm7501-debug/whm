// ===== CONFIGURATION =====
const CONFIG = {
    appName: 'Angeltia',
    version: '1.0.0',
    defaultTheme: 'dark',
    features: {
        music: true,
        camera: true,
        settings: true
    },
    admin: {
        password: "angeltia123", // غيري كلمة السر هنا
        storageKey: "angeltia_global_settings"
    }
};

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
            src: 'assets/music/track1.mp3',
            cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
            title: 'Digital Waves',
            artist: 'Angeltia',
            src: 'assets/music/track2.mp3',
            cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        }
    ],
    cameraStream: null,
    currentCamera: 'user',
    photos: [],
    profile: {
        name: 'تيا',
        bio: 'مطورة واجهات مستخدم | مصممة تجربة مستخدم',
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
const elements = {
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

// ===== CORE FUNCTIONS =====
function initApp() {
    console.log(`🎵 ${CONFIG.appName} v${CONFIG.version} initialized`);
    loadState();
    initMusic();
    initEvents();
    updateAdminUI();
    updateUI();
    showNotification('مرحباً بك في Angeltia! 🎉', 'success');
}

function loadState() {
    // أولاً: جيب الإعدادات العالمية
    const globalSettings = localStorage.getItem(CONFIG.admin.storageKey);
    if (globalSettings) {
        try {
            const global = JSON.parse(globalSettings);
            // طبق الإعدادات العالمية على الجميع
            state.profile.name = global.profile.name;
            state.profile.bio = global.profile.bio;
            state.profile.avatar = global.profile.avatar;
            state.profile.socialLinks = global.profile.socialLinks || [];
            state.tracks = global.tracks || state.tracks;
            state.settings.theme = global.settings?.theme || state.settings.theme;
        } catch (error) {
            console.error('خطأ في تحميل الإعدادات العالمية:', error);
        }
    }
    
    // ثانياً: جيب الإعدادات المحلية (للمشاهدات فقط)
    const saved = localStorage.getItem('angeltia_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.profile.views = parsed.profile?.views || state.profile.views;
        state.photos = parsed.photos || state.photos;
    }
    
    applyTheme(state.settings.theme);
}

function saveState() {
    // خزن فقط البيانات المحلية (المشاهدات والصور)
    const localState = {
        profile: {
            views: state.profile.views
        },
        photos: state.photos
    };
    localStorage.setItem('angeltia_state', JSON.stringify(localState));
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.settings.theme = theme;
}

function updateUI() {
    elements.profile.name.textContent = state.profile.name;
    elements.profile.bio.textContent = state.profile.bio;
    elements.profile.avatar.src = state.profile.avatar;
    elements.profile.views.textContent = formatNumber(state.profile.views);
    
    // تحديث حقول الإعدادات
    elements.settings.nameInput.value = state.profile.name;
    elements.settings.bioInput.value = state.profile.bio;
    
    updateMusicUI();
    updateGallery();
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ===== NAVIGATION =====
function showSection(sectionId) {
    Object.values(elements.sections).forEach(section => {
        section.classList.remove('active');
    });
    if (elements.sections[sectionId]) {
        elements.sections[sectionId].classList.add('active');
    }
    if (sectionId !== 'camera' && state.cameraStream) stopCamera();
    if (sectionId === 'camera' && !state.cameraStream) openCamera();
}

// ===== MUSIC PLAYER =====
function initMusic() {
    state.audio = new Audio();
    state.audio.volume = state.volume;
    loadTrack(state.currentTrack);
    state.audio.addEventListener('loadedmetadata', updateMusicTime);
    state.audio.addEventListener('timeupdate', updateMusicProgress);
    state.audio.addEventListener('ended', nextTrack);
    elements.music.volumeSlider.addEventListener('input', setVolume);
}

function loadTrack(index) {
    if (state.tracks[index]) {
        const track = state.tracks[index];
        state.currentTrack = index;
        state.audio.src = track.src;
        elements.music.cover.src = track.cover;
        elements.music.title.textContent = track.title;
        elements.music.artist.textContent = track.artist;
        elements.music.progress.style.width = '0%';
        elements.music.currentTime.textContent = '0:00';
        if (state.isPlaying) {
            state.audio.play().catch(error => {
                console.error('خطأ في التشغيل:', error);
                showNotification('تعذر تشغيل الأغنية', 'error');
            });
        }
    }
}

function togglePlay() {
    if (!state.audio.src) {
        showNotification('لا توجد أغنية للتشغيل', 'error');
        return;
    }
    
    if (state.isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    if (!state.audio.src) {
        showNotification('لا توجد أغنية للتشغيل', 'error');
        return;
    }
    
    state.audio.play().then(() => {
        state.isPlaying = true;
        elements.music.playIcon.className = 'fas fa-pause';
        increaseViews();
    }).catch(error => {
        console.error('خطأ في التشغيل:', error);
        showNotification('تعذر تشغيل الأغنية', 'error');
        state.isPlaying = false;
        elements.music.playIcon.className = 'fas fa-play';
    });
}

function pauseMusic() {
    state.audio.pause();
    state.isPlaying = false;
    elements.music.playIcon.className = 'fas fa-play';
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
    const volume = elements.music.volumeSlider.value / 100;
    state.volume = volume;
    state.audio.volume = volume;
}

function updateMusicProgress() {
    if (state.audio.duration) {
        const percent = (state.audio.currentTime / state.audio.duration) * 100;
        elements.music.progress.style.width = percent + '%';
        elements.music.currentTime.textContent = formatTime(state.audio.currentTime);
    }
}

function updateMusicTime() {
    elements.music.duration.textContent = formatTime(state.audio.duration);
}

function updateMusicUI() {
    if (state.tracks[state.currentTrack]) {
        const track = state.tracks[state.currentTrack];
        elements.music.cover.src = track.cover;
        elements.music.title.textContent = track.title;
        elements.music.artist.textContent = track.artist;
    }
    elements.music.volumeSlider.value = state.volume * 100;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== ADMIN SYSTEM =====
function isAdmin() {
    return localStorage.getItem('angeltia_admin') === 'true';
}

function loginAsAdmin() {
    const password = prompt("🔐 أدخل كلمة المرور للإدارة:");
    if (password === CONFIG.admin.password) {
        localStorage.setItem('angeltia_admin', 'true');
        showNotification('تم الدخول كمسؤول! 👑', 'success');
        updateAdminUI();
        showSection('settings');
        return true;
    } else {
        showNotification('كلمة المرور غير صحيحة', 'error');
        return false;
    }
}

function logoutAdmin() {
    localStorage.removeItem('angeltia_admin');
    showNotification('تم تسجيل الخروج', 'info');
    updateAdminUI();
    showSection('profile');
}

// ===== حفظ الإعدادات للكل =====
function saveGlobalSettings() {
    const globalSettings = {
        profile: {
            name: state.profile.name,
            bio: state.profile.bio,
            avatar: state.profile.avatar,
            socialLinks: state.profile.socialLinks
        },
        tracks: state.tracks,
        settings: {
            theme: state.settings.theme
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: state.profile.name
    };
    
    localStorage.setItem(CONFIG.admin.storageKey, JSON.stringify(globalSettings));
    showNotification('تم حفظ الإعدادات للجميع! 🌍', 'success');
}

function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const ownerBadge = document.getElementById('ownerBadge');
    if (isAdmin()) {
        adminElements.forEach(el => el.style.display = 'block');
        if (ownerBadge) ownerBadge.style.display = 'inline-block';
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        if (ownerBadge) ownerBadge.style.display = 'none';
    }
}

// ===== SOCIAL MEDIA =====
function showSocialLinks() {
    updateSocialLinksUI();
    document.getElementById('socialModal').classList.remove('hidden');
}

function closeSocialModal() {
    document.getElementById('socialModal').classList.add('hidden');
}

function updateSocialLinksUI() {
    const socialLinksContainer = document.getElementById('socialLinks');
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
    const platform = document.getElementById('socialPlatform').value;
    const url = document.getElementById('socialUrl').value.trim();
    if (!url) {
        showNotification('الرجاء إدخال الرابط', 'error');
        return;
    }
    if (!isValidUrl(url)) {
        showNotification('الرجاء إدخال رابط صحيح يبدأ بـ https://', 'error');
        return;
    }
    state.profile.socialLinks.push({ platform: platform, url: url, id: Date.now() });
    document.getElementById('socialUrl').value = '';
    updateSocialLinksUI();
    saveGlobalSettings(); // حفظ للكل مباشرة
    showNotification('تم إضافة الرابط للجميع! ✅', 'success');
}

function deleteSocialLink(index) {
    if (confirm('هل تريد حذف هذا الرابط؟')) {
        state.profile.socialLinks.splice(index, 1);
        updateSocialLinksUI();
        saveGlobalSettings(); // حفظ للكل مباشرة
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
        const constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: state.currentCamera } };
        state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        elements.camera.feed.srcObject = state.cameraStream;
        showNotification('الكاميرا جاهزة! 📸', 'success');
    } catch (error) {
        console.error('خطأ في الكاميرا:', error);
        showNotification('تعذر الوصول للكاميرا', 'error');
    }
}

function capturePhoto() {
    if (!state.cameraStream) return;
    const video = elements.camera.feed;
    const canvas = elements.camera.canvas;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/png');
    state.photos.push({ data: photoData, timestamp: new Date().toLocaleString('ar-SA'), id: Date.now() });
    increaseViews();
    updateGallery();
    saveState(); // حفظ المحلي فقط
    showNotification('تم التقاط الصورة! ✅', 'success');
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
    elements.camera.gallery.classList.toggle('hidden');
}

function updateGallery() {
    const galleryItems = elements.camera.galleryItems;
    galleryItems.innerHTML = '';
    state.photos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.data;
        img.alt = `صورة ${index + 1}`;
        img.className = 'gallery-item';
        img.onclick = () => viewPhoto(photo);
        galleryItems.appendChild(img);
    });
}

function viewPhoto(photo) {
    const link = document.createElement('a');
    link.href = photo.data;
    link.download = `angeltia_photo_${photo.id}.png`;
    link.click();
    showNotification('جاري تحميل الصورة...', 'info');
}

// ===== SETTINGS =====
function changeTheme(theme) {
    applyTheme(theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    // حفظ الوضع للكل مباشرة
    state.settings.theme = theme;
    saveGlobalSettings();
    
    showNotification(`تم التغيير إلى الوضع ${theme === 'dark' ? 'الداكن' : 'الفاتح'} للجميع! 🌍`, 'success');
}

function saveProfile() {
    const name = elements.settings.nameInput.value.trim();
    const bio = elements.settings.bioInput.value.trim();
    if (name) state.profile.name = name;
    if (bio) state.profile.bio = bio;
    
    const avatarFile = elements.settings.avatarInput.files[0];
    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.profile.avatar = e.target.result;
            updateUI();
            saveGlobalSettings(); // حفظ للكل بعد تحميل الصورة
        };
        reader.readAsDataURL(avatarFile);
    } else {
        updateUI();
        saveGlobalSettings(); // حفظ للكل مباشرة
    }
    
    const coverFile = elements.settings.coverInput.files[0];
    if (coverFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.tracks[state.currentTrack].cover = e.target.result;
            updateMusicUI();
            saveGlobalSettings(); // حفظ للكل بعد تحميل الصورة
        };
        reader.readAsDataURL(coverFile);
    }
    
    showNotification('تم حفظ الإعدادات للجميع! ✅', 'success');
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
    if (confirm(`هل تريدين حذف "${state.tracks[index].title}"؟`)) {
        state.tracks.splice(index, 1);
        if (state.currentTrack >= state.tracks.length) state.currentTrack = 0;
        if (state.tracks.length === 0) {
            pauseMusic();
            state.audio.src = '';
            updateMusicUI();
        } else loadTrack(state.currentTrack);
        closePlaylist();
        saveGlobalSettings(); // حفظ للكل
        showNotification('تم حذف الأغنية للجميع! 🗑️', 'success');
    }
}

// ===== UTILITY =====
function increaseViews() {
    state.profile.views++;
    updateUI();
    saveState(); // حفظ محلي فقط للمشاهدات
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
                cover: state.tracks[0].cover
            };
            state.tracks.push(newTrack);
            showNotification('تم إضافة الأغنية للجميع! 🎵', 'success');
            saveGlobalSettings(); // حفظ للكل
        };
        reader.readAsDataURL(file);
    } else showNotification('الرجاء اختيار ملف صوتي صحيح', 'error');
}

function showNotification(message, type = 'info') {
    elements.notificationText.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.remove('hidden');
    setTimeout(() => elements.notification.classList.add('hidden'), 3000);
}

// ===== EVENTS =====
function initEvents() {
    elements.music.progressBar.addEventListener('click', (e) => {
        if (!state.audio.duration) return;
        const rect = elements.music.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        state.audio.currentTime = percent * state.audio.duration;
    });
    elements.music.volumeSlider.addEventListener('change', setVolume);
    elements.settings.musicInput.addEventListener('change', handleMusicUpload);
    document.addEventListener('click', () => { if (Math.random() > 0.8) increaseViews(); });
    document.addEventListener('keydown', (e) => { if (e.code === 'Space' && state.cameraStream) capturePhoto(); });
    setInterval(() => {
        const randomIncrease = Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0;
        state.profile.views += randomIncrease;
        if (state.profile.views % 10 === 0) saveState();
        updateUI();
    }, 30000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('beforeunload', () => {
    if (state.cameraStream) stopCamera();
    if (state.isPlaying) pauseMusic();
    saveState();
});
console.log('🚀 Angeltia Portfolio Loaded Successfully!');