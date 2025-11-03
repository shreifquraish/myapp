// تصدير البيانات كملف
function exportData() {
    const userData = {
        passwords: JSON.parse(localStorage.getItem('passwords') || '[]'),
        activationCodes: JSON.parse(localStorage.getItem('activationCodes') || '[]'),
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myvault-backup-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('✅ تم تصدير النسخة الاحتياطية', 'success');
}

// استيراد البيانات
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const userData = JSON.parse(e.target.result);
            
            if (userData.passwords) localStorage.setItem('passwords', JSON.stringify(userData.passwords));
            if (userData.activationCodes) localStorage.setItem('activationCodes', JSON.stringify(userData.activationCodes));
            if (userData.users) localStorage.setItem('users', JSON.stringify(userData.users));
            
            showMessage('✅ تم استيراد البيانات بنجاح', 'success');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            showMessage('❌ ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
}
// عرض إحصائيات الاستخدام
function showStats() {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const activationCodes = JSON.parse(localStorage.getItem('activationCodes') || '[]');
    
    const stats = {
        totalPasswords: passwords.length,
        totalUsers: users.length,
        totalCodes: activationCodes.length,
        usedCodes: activationCodes.filter(code => code.used).length,
        strongPasswords: passwords.filter(p => checkPasswordStrength(p.password) === 'قوي جداً').length,
        weakPasswords: passwords.filter(p => checkPasswordStrength(p.password) === 'ضعيف').length
    };
    
    return stats;
}

// عرض واجهة الإحصائيات
function showStatsPanel() {
    const stats = showStats();
    
    const statsHTML = `
        <div class="stats-container">
            <h3>📊 إحصائيات التطبيق</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalPasswords}</div>
                    <div class="stat-label">كلمة مرور</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalUsers}</div>
                    <div class="stat-label">مستخدم</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalCodes}</div>
                    <div class="stat-label">كود تفعيل</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.usedCodes}</div>
                    <div class="stat-label">مفعل</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('statsContent').innerHTML = statsHTML;
    showSection('stats');
}
// التصنيفات المتاحة
const categories = [
    'شبكات اجتماعية',
    'بريد إلكتروني', 
    'عمل',
    'شخصي',
    'مالي',
    'تعليم',
    'ترفيه',
    'أخرى'
];

// إضافة تصنيف لكلمة المرور
function addPasswordWithCategory(title, username, password, category, notes = '') {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    
    passwords.push({
        id: Date.now().toString(),
        title,
        username,
        password,
        category,
        notes,
        createdDate: new Date().toISOString(),
        strength: checkPasswordStrength(password)
    });
    
    localStorage.setItem('passwords', JSON.stringify(passwords));
    showMessage('✅ تمت الإضافة بنجاح', 'success');
}

// تصفية كلمات المرور حسب التصنيف
function filterPasswordsByCategory(category) {
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');
    if (category === 'الكل') return passwords;
    return passwords.filter(p => p.category === category);
}
// نظام التحديث التلقائي المحسن
class EnhancedAutoUpdater extends AutoUpdater {
    constructor() {
        super();
        this.checkInterval = 2 * 60 * 1000; // كل دقيقتين
    }

    // بدء الفحص التلقائي الدوري
    startAutoCheck() {
        // فحص أولي بعد 10 ثواني
        setTimeout(() => this.silentCheck(), 10000);
        
        // فحص دوري كل دقيقتين
        setInterval(() => this.silentCheck(), this.checkInterval);
        
        console.log('✅ نظام التحديث التلقائي مفعل');
    }

    // تطبيق التحديث تلقائياً بدون تأكيد
    async applyUpdate(newVersion) {
        this.showMessage('🔄 جاري تثبيت التحديث الجديد...', 'info');
        
        try {
            // قائمة الملفات للتحديث
            const filesToUpdate = [
                'index.html',
                'user.html', 
                'admin.html',
                'script.js',
                'index.css'
            ];

            // تحديث كل الملفات
            for (const file of filesToUpdate) {
                await this.updateFile(file);
                console.log(`✅ تم تحديث: ${file}`);
            }

            // حفظ الإصدار الجديد
            localStorage.setItem('appVersion', newVersion);
            this.currentVersion = newVersion;
            
            this.showMessage('✅ تم التحديث بنجاح! جاري إعادة التحميل...', 'success');
            
            // إعادة تحميل الصفحة بعد 3 ثواني
            setTimeout(() => {
                location.reload(true);
            }, 3000);
            
        } catch (error) {
            this.showMessage('❌ فشل التحديث، جاري المحاولة مرة أخرى', 'error');
            setTimeout(() => this.applyUpdate(newVersion), 10000);
        }
    }

    // تحديث ملف معين
    async updateFile(filename) {
        const response = await fetch(`https://shreifquraish.github.io/MyVault-App/${filename}?t=${Date.now()}`);
        const content = await response.text();
        localStorage.setItem(`file_${filename}`, content);
        return content;
    }
}

// تشغيل النظام المحسن
document.addEventListener('DOMContentLoaded', function() {
    const enhancedUpdater = new EnhancedAutoUpdater();
    enhancedUpdater.startAutoCheck();
    
    // تحميل الملفات المحدثة إذا كانت موجودة
    loadUpdatedFiles();
});

// دالة تحميل الملفات المحدثة
function loadUpdatedFiles() {
    const currentPage = location.pathname.split('/').pop();
    
    // إذا كانت الصفحة الحالية مخزنة محلياً، نستخدمها
    const savedContent = localStorage.getItem(`file_${currentPage}`);
    if (savedContent && currentPage !== 'index.html') {
        document.open();
        document.write(savedContent);
        document.close();
        return true;
    }
    return false;
}

// إضافة زر تحديث يدوي في واجهة المستخدم
function addManualUpdateButton() {
    const updateBtn = document.createElement('button');
    updateBtn.innerHTML = '🔄 تحديث التطبيق';
    updateBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 20px;
        cursor: pointer;
        z-index: 9999;
        font-size: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    `;
    updateBtn.onclick = function() {
        const updater = new EnhancedAutoUpdater();
        updater.checkForUpdates();
    };
    document.body.appendChild(updateBtn);
}

// إضافة الزر بعد تحميل الصفحة
setTimeout(addManualUpdateButton, 2000);
// نظام المزامنة المركزي
class CentralDataSync {
    constructor() {
        this.dataUrl = 'https://shreifquraish.github.io/MyVault-App/central-data.json';
        this.syncInterval = 30 * 1000; // كل 30 ثانية
    }

    // بدء المزامنة
    startSync() {
        // مزامنة أولية
        this.syncData();
        
        // مزامنة دورية
        setInterval(() => this.syncData(), this.syncInterval);
    }

    // مزامنة البيانات
    async syncData() {
        try {
            const response = await fetch(this.dataUrl + '?t=' + Date.now());
            const centralData = await response.json();
            
            // مزامنة المستخدمين
            if (centralData.users && centralData.users.length > 0) {
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const mergedUsers = this.mergeUsers(localUsers, centralData.users);
                localStorage.setItem('users', JSON.stringify(mergedUsers));
            }
            
            // مزامنة أكواد التفعيل
            if (centralData.activationCodes && centralData.activationCodes.length > 0) {
                const localCodes = JSON.parse(localStorage.getItem('activationCodes') || '[]');
                const mergedCodes = this.mergeCodes(localCodes, centralData.activationCodes);
                localStorage.setItem('activationCodes', JSON.stringify(mergedCodes));
            }
            
            console.log('✅ تم مزامنة البيانات');
        } catch (error) {
            console.log('⚠️ لا يمكن مزامنة البيانات');
        }
    }

    // دمج المستخدمين
    mergeUsers(localUsers, centralUsers) {
        const userMap = new Map();
        
        // إضافة المستخدمين المحليين
        localUsers.forEach(user => userMap.set(user.username, user));
        
        // إضافة/تحديث المستخدمين من المركز
        centralUsers.forEach(user => userMap.set(user.username, user));
        
        return Array.from(userMap.values());
    }

    // دمج أكواد التفعيل
    mergeCodes(localCodes, centralCodes) {
        const codeMap = new Map();
        
        // إضافة الأكواد المحلية
        localCodes.forEach(code => codeMap.set(code.code, code));
        
        // إضافة/تحديث الأكواد من المركز
        centralCodes.forEach(code => codeMap.set(code.code, code));
        
        return Array.from(codeMap.values());
    }

    // إضافة مستخدم جديد للمركز
    async addUserToCentral(user) {
        try {
            // هنا بتكون محتاج تعمل نظام Backend حقيقي
            // لكن حالياً بنستخدم GitHub كبديل
            console.log('➕ إضافة مستخدم جديد:', user.username);
        } catch (error) {
            console.log('❌ لا يمكن إضافة المستخدم للمركز');
        }
    }

    // إضافة كود جديد للمركز
    async addCodeToCentral(code) {
        try {
            console.log('➕ إضافة كود جديد:', code.code);
        } catch (error) {
            console.log('❌ لا يمكن إضافة الكود للمركز');
        }
    }
}