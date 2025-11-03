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

// ⭐⭐ نظام النسخ الاحتياطي والاستعادة المحسن ⭐⭐
class BackupManager {
    constructor() {
        this.backupKey = 'myvault_backups';
        this.maxBackups = 5;
    }

    createBackup(name = '') {
        try {
            const backupData = {
                id: Date.now().toString(),
                name: name || `نسخة احتياطية ${new Date().toLocaleDateString('ar-EG')}`,
                timestamp: new Date().toISOString(),
                data: {
                    users: JSON.parse(localStorage.getItem('users') || '[]'),
                    activationCodes: JSON.parse(localStorage.getItem('activationCodes') || '[]'),
                    adminPassword: localStorage.getItem('adminPassword'),
                    appVersion: localStorage.getItem('appVersion') || '1.0.0'
                }
            };

            const existingBackups = this.getBackups();
            existingBackups.unshift(backupData);
            const trimmedBackups = existingBackups.slice(0, this.maxBackups);
            localStorage.setItem(this.backupKey, JSON.stringify(trimmedBackups));

            return {
                success: true,
                message: `✅ تم إنشاء النسخة الاحتياطية: ${backupData.name}`,
                backup: backupData
            };
            
        } catch (error) {
            return {
                success: false,
                message: '❌ فشل في إنشاء النسخة الاحتياطية'
            };
        }
    }

    getBackups() {
        return JSON.parse(localStorage.getItem(this.backupKey) || '[]');
    }

    restoreBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                return {
                    success: false,
                    message: '❌ النسخة الاحتياطية غير موجودة'
                };
            }

            localStorage.setItem('users', JSON.stringify(backup.data.users || []));
            localStorage.setItem('activationCodes', JSON.stringify(backup.data.activationCodes || []));
            
            if (backup.data.adminPassword) {
                localStorage.setItem('adminPassword', backup.data.adminPassword);
            }
            
            if (backup.data.appVersion) {
                localStorage.setItem('appVersion', backup.data.appVersion);
            }

            return {
                success: true,
                message: `✅ تم استعادة النسخة: ${backup.name}`,
                backup: backup
            };

        } catch (error) {
            return {
                success: false,
                message: '❌ فشل في استعادة النسخة الاحتياطية'
            };
        }
    }

    deleteBackup(backupId) {
        try {
            const backups = this.getBackups();
            const filteredBackups = backups.filter(b => b.id !== backupId);
            localStorage.setItem(this.backupKey, JSON.stringify(filteredBackups));
            
            return {
                success: true,
                message: '✅ تم حذف النسخة الاحتياطية'
            };
            
        } catch (error) {
            return {
                success: false,
                message: '❌ فشل في حذف النسخة الاحتياطية'
            };
        }
    }

    exportBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id === backupId);
            
            if (!backup) {
                alert('❌ النسخة غير موجودة');
                return;
            }

            const dataStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `myvault-backup-${backupId}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            alert('❌ فشل في تصدير النسخة');
        }
    }

    importBackup(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    if (!backupData.data || !backupData.timestamp) {
                        resolve({
                            success: false,
                            message: '❌ ملف غير صالح'
                        });
                        return;
                    }

                    const existingBackups = this.getBackups();
                    existingBackups.unshift(backupData);
                    const trimmedBackups = existingBackups.slice(0, this.maxBackups);
                    localStorage.setItem(this.backupKey, JSON.stringify(trimmedBackups));

                    resolve({
                        success: true,
                        message: '✅ تم استيراد النسخة بنجاح'
                    });

                } catch (error) {
                    resolve({
                        success: false,
                        message: '❌ ملف تالف أو غير صالح'
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    success: false,
                    message: '❌ فشل في قراءة الملف'
                });
            };

            reader.readAsText(file);
        });
    }
}

// ⭐⭐ واجهة إدارة النسخ الاحتياطية ⭐⭐
function showBackupManager() {
    const backupManager = new BackupManager();
    const backups = backupManager.getBackups();

    let backupsHTML = '';
    
    if (backups.length === 0) {
        backupsHTML = `
            <div class="empty-state">
                <div>💾</div>
                <h3>لا توجد نسخ احتياطية</h3>
                <p>أنشئ نسخة احتياطية أولى لحماية بياناتك</p>
            </div>
        `;
    } else {
        backupsHTML = backups.map(backup => `
            <div class="backup-item" style="
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 10px; 
                margin-bottom: 10px;
                border-left: 4px solid #28a745;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong>${backup.name}</strong>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${new Date(backup.timestamp).toLocaleString('ar-EG')}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            المستخدمين: ${backup.data.users?.length || 0} | 
                            الأكواد: ${backup.data.activationCodes?.length || 0}
                        </div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="restoreBackup('${backup.id}')" class="btn btn-sm" 
                                style="background: #17a2b8; color: white; padding: 5px 10px;">
                            استعادة
                        </button>
                        <button onclick="exportBackupFile('${backup.id}')" class="btn btn-sm" 
                                style="background: #28a745; color: white; padding: 5px 10px;">
                            تصدير
                        </button>
                        <button onclick="deleteBackup('${backup.id}')" class="btn btn-sm" 
                                style="background: #dc3545; color: white; padding: 5px 10px;">
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const backupModalHTML = `
        <div id="backupModal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
            align-items: center; justify-content: center;
        ">
            <div style="
                background: white; padding: 30px; border-radius: 15px; 
                width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;
            ">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">💾 إدارة النسخ الاحتياطية</h3>
                    <button onclick="closeBackupManager()" style="
                        background: none; border: none; font-size: 20px; 
                        cursor: pointer; color: #666;
                    ">×</button>
                </div>

                <div style="margin-bottom: 20px;">
                    <button onclick="createNewBackup()" class="btn" 
                            style="background: #007bff; color: white; width: 100%;">
                        ➕ إنشاء نسخة احتياطية جديدة
                    </button>
                </div>

                <div style="margin-bottom: 20px;">
                    <label>📥 استيراد نسخة احتياطية</label>
                    <input type="file" id="backupFileInput" accept=".json" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button onclick="importBackupFile()" class="btn" 
                            style="background: #28a745; color: white; width: 100%; margin-top: 10px;">
                        استيراد الملف
                    </button>
                </div>

                <div>
                    <h4>📋 النسخ الاحتياطية المخزنة</h4>
                    <div id="backupsList">
                        ${backupsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', backupModalHTML);
}

// ⭐⭐ دوال المساعدة للواجهة ⭐⭐
function createNewBackup() {
    const name = prompt('أدخل اسم للنسخة الاحتياطية (اختياري):');
    const backupManager = new BackupManager();
    const result = backupManager.createBackup(name);
    
    alert(result.message);
    if (result.success) {
        closeBackupManager();
        showBackupManager();
    }
}

function restoreBackup(backupId) {
    if (!confirm('⚠️ هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال جميع البيانات الحالية!')) {
        return;
    }
    
    const backupManager = new BackupManager();
    const result = backupManager.restoreBackup(backupId);
    
    alert(result.message);
    if (result.success) {
        setTimeout(() => location.reload(), 2000);
    }
}

function deleteBackup(backupId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
        return;
    }
    
    const backupManager = new BackupManager();
    const result = backupManager.deleteBackup(backupId);
    
    alert(result.message);
    if (result.success) {
        closeBackupManager();
        showBackupManager();
    }
}

function exportBackupFile(backupId) {
    const backupManager = new BackupManager();
    backupManager.exportBackup(backupId);
}

async function importBackupFile() {
    const fileInput = document.getElementById('backupFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('❌ يرجى اختيار ملف');
        return;
    }
    
    const backupManager = new BackupManager();
    const result = await backupManager.importBackup(file);
    
    alert(result.message);
    if (result.success) {
        closeBackupManager();
        showBackupManager();
    }
}

function closeBackupManager() {
    const modal = document.getElementById('backupModal');
    if (modal) {
        modal.remove();
    }
}

// ⭐⭐ إضافة زر النسخ الاحتياطي في واجهة الأدمن ⭐⭐
function addBackupButtonToAdmin() {
    const backupButtonHTML = `
        <div class="card">
            <h3>💾 النسخ الاحتياطي والاستعادة</h3>
            <p style="color: #666; margin-bottom: 15px;">
                قم بحفظ واستعادة بيانات التطبيق لحماية معلوماتك
            </p>
            <button class="btn" onclick="showBackupManager()" 
                    style="background: linear-gradient(135deg, #17a2b8, #138496);">
                فتح مدير النسخ الاحتياطية
            </button>
        </div>
    `;
    
    const settingsSection = document.getElementById('settings');
    if (settingsSection) {
        settingsSection.insertAdjacentHTML('afterbegin', backupButtonHTML);
    }
}

// ⭐⭐ النسخ الاحتياطي التلقائي ⭐⭐
function setupAutoBackup() {
    setInterval(() => {
        const lastBackup = localStorage.getItem('lastAutoBackup');
        const now = Date.now();
        
        if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
            const backupManager = new BackupManager();
            backupManager.createBackup('نسخة تلقائية');
            localStorage.setItem('lastAutoBackup', now.toString());
            console.log('✅ تم النسخ الاحتياطي التلقائي');
        }
    }, 60 * 60 * 1000);
}

// ⭐⭐ نظام التحديث التلقائي المحسن ⭐⭐
class EnhancedAutoUpdater {
    constructor() {
        this.currentVersion = localStorage.getItem('appVersion') || '1.0.0';
    }

    async checkForUpdates() {
        this.showMessage('🔍 جاري التحقق من التحديثات...', 'info');
        
        // ⭐⭐ إصدار ثابت - غير الرقم ده علشان توصل تحديث ⭐⭐
        const latestVersion = "7";
        const changes = "✨ إضافة نظام النسخ الاحتياطي المتكامل";
        
        setTimeout(() => {
            if (latestVersion !== this.currentVersion) {
                if (confirm(`🔄 يوجد تحديث جديد (${latestVersion})\n\n${changes}\n\nهل تريد التحديث الآن؟`)) {
                    localStorage.setItem('appVersion', latestVersion);
                    this.showMessage('✅ تم التحديث! جاري إعادة التحميل...', 'success');
                    setTimeout(() => location.reload(), 2000);
                }
            } else {
                this.showMessage('✅ التطبيق محدث', 'success');
            }
        }, 1000);
    }

    showMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
            color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
            padding: 15px; border-radius: 5px; z-index: 10000;
            border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
        `;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// ⭐⭐ نظام المزامنة المركزي ⭐⭐
class CentralDataSync {
    constructor() {
        this.dataUrl = 'https://shreifquraish.github.io/myapp/central-data.json';
        this.syncInterval = 30 * 1000;
    }

    startSync() {
        this.syncData();
        setInterval(() => this.syncData(), this.syncInterval);
    }

    async syncData() {
        try {
            const response = await fetch(this.dataUrl + '?t=' + Date.now());
            const centralData = await response.json();
            
            if (centralData.users && centralData.users.length > 0) {
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const mergedUsers = this.mergeUsers(localUsers, centralData.users);
                localStorage.setItem('users', JSON.stringify(mergedUsers));
            }
            
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

    mergeUsers(localUsers, centralUsers) {
        const userMap = new Map();
        localUsers.forEach(user => userMap.set(user.username, user));
        centralUsers.forEach(user => userMap.set(user.username, user));
        return Array.from(userMap.values());
    }

    mergeCodes(localCodes, centralCodes) {
        const codeMap = new Map();
        localCodes.forEach(code => codeMap.set(code.code, code));
        centralCodes.forEach(code => codeMap.set(code.code, code));
        return Array.from(codeMap.values());
    }

    async addUserToCentral(user) {
        try {
            console.log('➕ إضافة مستخدم جديد:', user.username);
        } catch (error) {
            console.log('❌ لا يمكن إضافة المستخدم للمركز');
        }
    }

    async addCodeToCentral(code) {
        try {
            console.log('➕ إضافة كود جديد:', code.code);
        } catch (error) {
            console.log('❌ لا يمكن إضافة الكود للمركز');
        }
    }
}

// ⭐⭐ التهيئة الآمنة ⭐⭐
function initializeAppSafely() {
    setTimeout(() => {
        const enhancedUpdater = new EnhancedAutoUpdater();
        
        addBackupButtonToAdmin();
        setupAutoBackup();
        
        console.log('✅ التهيئة اكتملت');
    }, 1000);
}

// بدء التطبيق
setTimeout(function() {
    console.log('🚀 تهيئة التطبيق...');
    
    initializeAppSafely();
    
    console.log('✅ الإصدار 6 محمل - جاهز للتحديث');
}, 500);

// إضافة زر تحديث يدوي
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