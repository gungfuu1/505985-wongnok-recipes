const supabaseUrl = 'https://asooyypcnuxtaxzosvaa.supabase.co/rest/v1';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb295eXBjbnV4dGF4em9zdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Nzk1MjAsImV4cCI6MjA2MzA1NTUyMH0.KUc401gp9ITSU4q_LHKFwzD0LFhL0rUxs-SVk2ZFpTQ';

export function gfLogin() {
    const email = document.getElementById('gf-login-email').value;
    const password = document.getElementById('gf-login-password').value;

    fetch(`${supabaseUrl}/users?email=eq.${email}&password=eq.${password}`, {
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.length) {
            localStorage.setItem('user', JSON.stringify(data[0]));
            alert('เข้าสู่ระบบสำเร็จ');
            window.location.href = 'index.html';
        } else {
            alert('Email หรือ Password ไม่ถูกต้อง');
        }
    });
}

export function gfRegister() {
    const data = {
        fullname: document.getElementById('gf-fullname').value,
        age: document.getElementById('gf-age').value,
        occupation: document.getElementById('gf-occupation').value,
        email: document.getElementById('gf-email').value,
        birthdate: document.getElementById('gf-birthdate').value,
        password: document.getElementById('gf-password').value,
        created_at: new Date().toISOString()
    };

    fetch(`${supabaseUrl}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        alert('ลงทะเบียนสำเร็จ');
        window.location.href = 'login.html';
    });
}

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

export function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const createMenu = document.getElementById('createRecipeMenu');
    const loginMenu = document.getElementById('loginMenu');

    if (user) {
        if (createMenu) createMenu.style.display = 'inline-block';
        if (loginMenu) {
            loginMenu.innerText = 'ออกจากระบบ';
            loginMenu.onclick = function() {
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            };
        }
    } else {
        if (createMenu) createMenu.style.display = 'none';
        if (loginMenu) {
            loginMenu.innerText = 'เข้าสู่ระบบ';
            loginMenu.onclick = function() {
                window.location.href = 'login.html';
            };
        }
    }
}
