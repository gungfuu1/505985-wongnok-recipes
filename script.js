const supabaseUrl = 'https://kiqgltbzomgteccozsfg.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ใช้ของคุณเองเต็มๆ
const usersEndpoint = `${supabaseUrl}/rest/v1/users`;

document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();

  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', registerUser);
  }
});

function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user'));
  const createMenu = document.getElementById('createRecipeMenu');
  const loginMenu = document.getElementById('loginMenu');

  if (user) {
    if (createMenu) createMenu.style.display = 'inline-block';
    if (loginMenu) {
      loginMenu.innerText = 'ออกจากระบบ';
      loginMenu.onclick = () => {
        localStorage.removeItem('user');
        location.href = 'index.html';
      };
    }
  } else {
    if (createMenu) createMenu.style.display = 'none';
    if (loginMenu) {
      loginMenu.innerText = 'เข้าสู่ระบบ';
      loginMenu.onclick = () => {
        location.href = 'login.html';
      };
    }
  }
}

function registerUser() {
  const data = {
    fullname: document.getElementById('fullname').value,
    age: parseInt(document.getElementById('age').value),
    occupation: document.getElementById('occupation').value,
    email: document.getElementById('email').value,
    birthdate: document.getElementById('birthdate').value,
    password: document.getElementById('password').value,
    created_at: new Date().toISOString()
  };

  axios.post(usersEndpoint, data, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  })
  .then(res => {
    alert('ลงทะเบียนสำเร็จ');
    window.location.href = 'login.html';
  })
  .catch(err => {
    console.error('Register error:', err);
    alert('ลงทะเบียนไม่สำเร็จ');
  });
}
