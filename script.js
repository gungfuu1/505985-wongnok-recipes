// กำหนด URL และ API Key สำหรับเชื่อมต่อกับ Supabase
const supabaseUrl = 'https://asooyypcnuxtaxzosvaa.supabase.co/rest/v1';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb295eXBjbnV4dGF4em9zdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Nzk1MjAsImV4cCI6MjA2MzA1NTUyMH0.KUc401gp9ITSU4q_LHKFwzD0LFhL0rUxs-SVk2ZFpTQ';

/**
 * ฟังก์ชันสำหรับเข้าสู่ระบบ
 * ดึงข้อมูลอีเมลและรหัสผ่านจากฟอร์ม แล้วตรวจสอบกับฐานข้อมูล
 */
export function gfLogin() {
    // ดึงค่าอีเมลและรหัสผ่านจากฟอร์ม
    const email = document.getElementById('gf-login-email').value;
    const password = document.getElementById('gf-login-password').value;
    
    // ส่งคำขอไปยัง Supabase API เพื่อตรวจสอบข้อมูลผู้ใช้
    fetch(`${supabaseUrl}/users?email=eq.${email}&password=eq.${password}`, {
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.length) {
            // ถ้าพบข้อมูลผู้ใช้ เก็บข้อมูลลงใน localStorage และนำทางไปยังหน้าหลัก
            localStorage.setItem('user', JSON.stringify(data[0]));
            alert('เข้าสู่ระบบสําเร็จ');
            window.location.href = 'index.html';
        } else {
            // ถ้าไม่พบข้อมูลผู้ใช้ แสดงข้อความแจ้งเตือน
            alert('Email หรือ Password ไม่ถูกต้อง');
        }
    });
}

/**
 * ฟังก์ชันสำหรับลงทะเบียนผู้ใช้ใหม่
 * ดึงข้อมูลจากฟอร์มลงทะเบียนและส่งไปยังฐานข้อมูล
 */
export function gfRegister() {
    // สร้างออบเจกต์ข้อมูลผู้ใช้จากฟอร์ม
    const data = {
        fullname: document.getElementById('gf-fullname').value,
        age: document.getElementById('gf-age').value,
        occupation: document.getElementById('gf-occupation').value,
        email: document.getElementById('gf-email').value,
        birthdate: document.getElementById('gf-birthdate').value,
        password: document.getElementById('gf-password').value,
        created_at: new Date().toISOString()
    };
    
    // ส่งข้อมูลไปยัง Supabase API เพื่อสร้างผู้ใช้ใหม่
    fetch(`${supabaseUrl}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Prefer': 'return=representation'  // ให้ Supabase return ข้อมูลกลับ
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        const text = await res.text(); // อ่าน response เป็นข้อความดิบก่อน
        let responseData;
        try {
            responseData = JSON.parse(text); // พยายาม parse JSON
        } catch (err) {
            throw new Error(`ไม่สามารถแปลง response เป็น JSON ได้: ${text}`);
        }

        if (!res.ok) {
            throw new Error(JSON.stringify(responseData));
        }

        alert('ลงทะเบียนสำเร็จ');
        window.location.href = 'login.html';
    })
    .catch(err => {
        console.error('Register error:', err);
        alert('ลงทะเบียนไม่สำเร็จ: ' + err.message);
    });
}

/**
 * ฟังก์ชันสำหรับสร้างสูตรอาหารใหม่
 * @param {string} title - ชื่อเมนูอาหาร
 * @param {string} detail - รายละเอียดเมนูอาหาร
 * @param {string} ingredients - วัตถุดิบ
 * @param {string} steps - ขั้นตอนการทำ
 * @param {string} cookingTime - เวลาที่ใช้ในการทำอาหาร
 * @param {string} imageUrl - URL ของรูปภาพอาหาร
 * @param {number} userId - ID ของผู้ใช้ที่สร้างสูตรอาหาร
 * @returns {Promise} - ข้อมูลสูตรอาหารที่สร้างหรือ null หากเกิดข้อผิดพลาด
 */
export async function createRecipe(title, detail, ingredients, steps, cookingTime, imageUrl, userId) {
    try {
        const response = await fetch(`${supabaseUrl}/recipes`, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                detail: detail,
                ingredients: ingredients,
                steps: steps,
                cooking_time: cookingTime,
                image_url: imageUrl,
                user_id: userId,
                created_at: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการส่งข้อมูล');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * ฟังก์ชันตรวจสอบสถานะการเข้าสู่ระบบของผู้ใช้
 * ปรับเปลี่ยนการแสดงผลเมนูตามสถานะการเข้าสู่ระบบ
 */
export function checkLoginStatus() {
    // ดึงข้อมูลผู้ใช้จาก localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    
    // ดึงอ้างอิงถึงเมนูที่ต้องการปรับเปลี่ยน
    const createMenu = document.getElementById('createRecipeMenu');
    const loginMenu = document.getElementById('loginMenu');
    
    if (user) {
        // ถ้าผู้ใช้เข้าสู่ระบบแล้ว
        if (createMenu) createMenu.style.display = 'inline-block';  // แสดงเมนูสร้างสูตรอาหาร
        
        if (loginMenu) {
            loginMenu.innerText = 'ออกจากระบบ';  // เปลี่ยนข้อความปุ่มเป็น "ออกจากระบบ"
            loginMenu.onclick = function() {
                localStorage.removeItem('user');  // ลบข้อมูลผู้ใช้จาก localStorage
                window.location.href = 'index.html';  // กลับไปยังหน้าหลัก
            };
        }
    } else {
        // ถ้าผู้ใช้ยังไม่เข้าสู่ระบบ
        if (createMenu) createMenu.style.display = 'none';  // ซ่อนเมนูสร้างสูตรอาหาร
        
        if (loginMenu) {
            loginMenu.innerText = 'เข้าสู่ระบบ';  // เปลี่ยนข้อความปุ่มเป็น "เข้าสู่ระบบ"
            loginMenu.onclick = function() {
                window.location.href = 'login.html';  // นำทางไปยังหน้าเข้าสู่ระบบ
            };
        }
    }
}