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

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', loginUser);
  }
});

function loginUser() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  axios.get(`${supabaseUrl}/rest/v1/users`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    },
    params: {
      email: `eq.${email}`,
      password: `eq.${password}`
    }
  })
  .then(res => {
    const users = res.data;
    if (users.length > 0) {
      localStorage.setItem('user', JSON.stringify(users[0]));
      alert('เข้าสู่ระบบสำเร็จ');
      window.location.href = 'index.html';
    } else {
      alert('Email หรือ Password ไม่ถูกต้อง');
    }
  })
  .catch(err => {
    console.error('Login error:', err);
    alert('เกิดข้อผิดพลาด');
  });
}

// สร้างเมนูอาหาร
document.addEventListener('DOMContentLoaded', () => {
  const createForm = document.getElementById('createForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return alert('กรุณาเข้าสู่ระบบ');

      const data = {
        title: document.getElementById('title').value,
        detail: document.getElementById('detail').value,
        ingredients: document.getElementById('ingredients').value,
        steps: document.getElementById('steps').value,
        cooking_time: parseInt(document.getElementById('cookingTime').value),
        difficulty: document.getElementById('difficulty').value,
        image_url: document.getElementById('imageUrl').value,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      axios.post(`${supabaseUrl}/rest/v1/recipes`, data, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      .then(() => {
        alert('บันทึกเมนูเรียบร้อยแล้ว');
        window.location.href = 'profile.html';
      })
      .catch(err => {
        console.error('create error', err);
        alert('เกิดข้อผิดพลาด');
      });
    });
  }

  const profileSection = document.getElementById('myRecipes');
  if (profileSection) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return (profileSection.innerHTML = 'กรุณาเข้าสู่ระบบ');

    loadUserRecipes(user.id);
  }
});

// โหลดเมนูของฉัน
function loadUserRecipes(userId) {
  axios.get(`${supabaseUrl}/rest/v1/recipes?user_id=eq.${userId}&order=created_at.desc`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => {
    const html = res.data.map(r => `
      <div class="gf-third gf-container gf-padding">
        <div class="gf-card gf-light-grey">
          <img src="${r.image_url}" style="width:100%">
          <div class="gf-container">
            <h4>${r.title}</h4>
            <p>${r.detail || ''}</p>
            <button class="gf-button gf-red" onclick="deleteRecipe(${r.id})">ลบ</button>
          </div>
        </div>
      </div>
    `).join('');
    document.getElementById('myRecipes').innerHTML = html;
  });
}

// ลบเมนู
function deleteRecipe(id) {
  if (!confirm('คุณต้องการลบเมนูนี้ใช่หรือไม่?')) return;

  axios.delete(`${supabaseUrl}/rest/v1/recipes?id=eq.${id}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(() => {
    alert('ลบเมนูแล้ว');
    location.reload();
  });
}
