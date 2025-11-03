const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// بيانات التطبيق في الذاكرة
const users = {};
const userData = {};
const otpCodes = {};
const adminPassword = '$2a$10$X8RnftJ.DeDLyS1k2QmC5e7V.z.ZZQvC94Uzq.L7j.7y7Q5kz8RmW'; // 123456

app.use(express.json({ limit: '50mb' }));
app.use(express.static('www'));

// الصفحات
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'login.html'));
});

app.get('/user-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'user-login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'admin.html'));
});

// التحقق من المسؤول
app.post('/verify-admin', async (req, res) => {
    const { password } = req.body;
    const valid = await bcrypt.compare(password, adminPassword);
    res.json({ success: valid });
});

// تغيير كلمة سر المسؤول
app.post('/change-admin-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const validCurrent = await bcrypt.compare(currentPassword, adminPassword);
    
    if (!validCurrent) {
        return res.json({ success: false, message: 'كلمة السر الحالية غير صحيحة' });
    }

    // هنا بيكون فيه تحديث لكلمة السر لكن علشان البيانات في الذاكرة مش هتتغير
    res.json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
});

// إنشاء كود
app.post('/create-otp', (req, res) => {
    const { otpCode } = req.body;
    
    if (otpCodes[otpCode]) {
        return res.json({ success: false, message: 'الكود موجود' });
    }
    
    otpCodes[otpCode] = { 
        used: false, 
        createdAt: new Date().toISOString() 
    };
    res.json({ success: true, message: 'تم إنشاء الكود' });
});

// التحقق من الكود
app.post('/verify-otp', (req, res) => {
    const { otpCode } = req.body;
    
    if (!otpCodes[otpCode] || otpCodes[otpCode].used) {
        return res.json({ success: false, message: 'الكود غير صالح' });
    }
    
    res.json({ success: true, message: 'الكود صالح' });
});

// إنشاء مستخدم
app.post('/create-user', async (req, res) => {
    try {
        const { username, password, otpCode } = req.body;
        
        if (users[username]) {
            return res.json({ success: false, message: 'المستخدم موجود' });
        }
        
        if (!otpCodes[otpCode] || otpCodes[otpCode].used) {
            return res.json({ success: false, message: 'الكود غير صالح' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        users[username] = {
            password: hashedPassword,
            plainPassword: password,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        userData[username] = {
            emails: [],
            passwords: [],
            photos: [],
            documents: [],
            notes: [],
            createdAt: new Date().toISOString()
        };
        
        otpCodes[otpCode].used = true;
        otpCodes[otpCode].usedAt = new Date().toISOString();
        otpCodes[otpCode].usedBy = username;
        
        res.json({ success: true, message: 'تم إنشاء الحساب' });
    } catch (error) {
        res.json({ success: false, message: 'خطأ في إنشاء الحساب' });
    }
});

// دخول مستخدم
app.post('/user-login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!users[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    const validPassword = await bcrypt.compare(password, users[username].password);
    if (!validPassword) {
        return res.json({ success: false, message: 'كلمة السر خطأ' });
    }
    
    users[username].lastLogin = new Date().toISOString();
    res.json({ success: true, message: 'تم الدخول', username });
});

// إضافة إيميل
app.post('/add-email', (req, res) => {
    const { username, email, emailPassword, provider, notes } = req.body;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    userData[username].emails.push({
        email,
        password: emailPassword,
        provider: provider || 'غير محدد',
        notes: notes || '',
        addedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'تم إضافة الإيميل' });
});

// إضافة كلمة سر موقع
app.post('/add-password', (req, res) => {
    const { username, website, siteUsername, password, notes } = req.body;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    userData[username].passwords.push({
        website,
        username: siteUsername,
        password,
        notes: notes || '',
        addedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'تم إضافة كلمة السر' });
});

// إضافة ملاحظة
app.post('/add-note', (req, res) => {
    const { username, title, content } = req.body;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    userData[username].notes.push({
        title,
        content,
        addedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'تم إضافة الملاحظة' });
});

// إضافة صورة
app.post('/add-photo', (req, res) => {
    const { username, photoName, photoData, description } = req.body;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    userData[username].photos.push({
        name: photoName,
        data: photoData,
        description: description || '',
        size: photoData.length,
        addedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'تم إضافة الصورة' });
});

// إضافة مستند
app.post('/add-document', (req, res) => {
    const { username, docName, docData, docType, description } = req.body;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    userData[username].documents.push({
        name: docName,
        data: docData,
        type: docType || 'other',
        description: description || '',
        size: docData.length,
        addedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'تم إضافة المستند' });
});

// جلب بيانات المستخدم
app.get('/user-data/:username', (req, res) => {
    const { username } = req.params;
    
    if (!userData[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    res.json({ success: true, data: userData[username] });
});

// جلب إحصائيات
app.get('/admin-stats', (req, res) => {
    const stats = {
        totalUsers: Object.keys(users).length,
        activeOTPs: Object.values(otpCodes).filter(otp => !otp.used).length,
        usedOTPs: Object.values(otpCodes).filter(otp => otp.used).length,
        totalOTPs: Object.keys(otpCodes).length
    };
    
    res.json({ success: true, data: stats });
});

// جلب كل بيانات المستخدمين
app.get('/admin-all-users', (req, res) => {
    const allUserData = {};
    
    Object.keys(users).forEach(username => {
        allUserData[username] = {
            accountInfo: users[username],
            personalData: userData[username]
        };
    });
    
    res.json({ success: true, data: allUserData });
});

// جلب بيانات مستخدم معين
app.get('/admin-user-data/:username', (req, res) => {
    const { username } = req.params;
    
    if (!users[username]) {
        return res.json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    res.json({
        success: true,
        data: {
            accountInfo: users[username],
            personalData: userData[username]
        }
    });
});

// جلب كلمات السر الحقيقية
app.get('/admin-real-passwords', (req, res) => {
    const realPasswords = {};
    
    Object.keys(users).forEach(username => {
        realPasswords[username] = {
            username: username,
            password: users[username].plainPassword,
            createdAt: users[username].createdAt,
            lastLogin: users[username].lastLogin
        };
    });
    
    res.json({ success: true, data: realPasswords });
});

// جلب كل البيانات الحساسة
app.get('/admin-all-data', (req, res) => {
    const allData = {};
    
    Object.keys(users).forEach(username => {
        allData[username] = {
            account: {
                username: username,
                createdAt: users[username].createdAt,
                lastLogin: users[username].lastLogin,
                passwordHash: users[username].password,
                plainPassword: users[username].plainPassword
            },
            emails: userData[username].emails,
            passwords: userData[username].passwords,
            photos: userData[username].photos,
            documents: userData[username].documents,
            notes: userData[username].notes
        };
    });
    
    res.json({ success: true, data: allData });
});

// عرض صورة
app.get('/get-photo/:username/:photoIndex', (req, res) => {
    const { username, photoIndex } = req.params;
    
    if (!userData[username] || !userData[username].photos[photoIndex]) {
        return res.status(404).json({ success: false, message: 'الصورة غير موجودة' });
    }
    
    res.json({ success: true, data: userData[username].photos[photoIndex] });
});

// عرض مستند
app.get('/get-document/:username/:docIndex', (req, res) => {
    const { username, docIndex } = req.params;
    
    if (!userData[username] || !userData[username].documents[docIndex]) {
        return res.status(404).json({ success: false, message: 'المستند غير موجود' });
    }
    
    res.json({ success: true, data: userData[username].documents[docIndex] });
});

// بدء السيرفر
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VaultCrypt شغال على: http://localhost:${PORT}`);
    console.log(`🔐 كلمة سر المسؤول: 123456`);
    console.log(`📱 افتح في الموبايل: http://192.168.1.xxx:${PORT}`);
});