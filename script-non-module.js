// === Supabase config ===
const supabaseUrl = 'https://kiqgltbzomgteccozsfg.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ตัดทอนเพื่อความปลอดภัย

// === เช็คสถานะล็อกอิน ===
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user'));
  const loginMenu = document.getElementById('loginMenu');
  const createMenu = document.getElementById('createRecipeMenu');

  if (user) {
    loginMenu.textContent = 'ออกจากระบบ';
    loginMenu.onclick = () => {
      localStorage.removeItem('user');
      location.href = 'index.html';
    };
    if (createMenu) createMenu.style.display = 'inline-block';
  } else {
    loginMenu.textContent = 'เข้าสู่ระบบ';
    loginMenu.onclick = () => location.href = 'login.html';
    if (createMenu) createMenu.style.display = 'none';
  }
}

// === โหลดเมนูอาหารทั้งหมด + search + sort ===
function loadAllRecipes() {
  const keyword = document.getElementById('searchBox')?.value.trim();
  const sort = document.getElementById('filterSelect')?.value;

  let query = `${supabaseUrl}/rest/v1/recipes?select=*,users(fullname),ratings(rating)`;
  if (keyword) {
    query += `&or=(title.ilike.*${keyword}*,ingredients.ilike.*${keyword}*)`;
  }

  axios.get(query, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => {
    let recipes = res.data;

    if (sort === 'rating') {
      recipes.sort((a, b) => {
        const avgA = a.ratings?.reduce((sum, r) => sum + r.rating, 0) / (a.ratings?.length || 1);
        const avgB = b.ratings?.reduce((sum, r) => sum + r.rating, 0) / (b.ratings?.length || 1);
        return avgB - avgA;
      });
    } else if (sort === 'cooking_time') {
      recipes.sort((a, b) => (a.cooking_time || 9999) - (b.cooking_time || 9999));
    }

    const list = document.getElementById('recipesList');
    list.innerHTML = recipes.map(r => {
      const ratings = r.ratings || [];
      const avg = ratings.length
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : "ยังไม่มี";

      const user = JSON.parse(localStorage.getItem('user'));
      const canRate = user && user.id !== r.user_id;

      return `
        <div class="gf-third gf-margin-bottom">
          <div class="gf-card-4 gf-card-fixed">
            <img src="${r.image_url}" style="width:100%">
            <div class="gf-container gf-card-body">
              <div>
                <h4><b>${r.title}</b></h4>
                <p class="gf-truncate-3">${r.detail || ''}</p>
              </div>
              <div>
                <p>⭐ ${avg} (${ratings.length} โหวต)</p>
                <p>👤 โดย ${r.users?.fullname || 'ไม่ทราบชื่อ'}</p>
                ${canRate ? `
                  <select onchange="submitRating(${r.id}, this.value)">
                    <option value="">ให้คะแนน</option>
                    <option value="1">1 ดาว</option>
                    <option value="2">2 ดาว</option>
                    <option value="3">3 ดาว</option>
                    <option value="4">4 ดาว</option>
                    <option value="5">5 ดาว</option>
                  </select>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// === ส่งคะแนนเมนู ===
function submitRating(recipeId, value) {
  const rating = parseInt(value);
  if (!rating || rating < 1 || rating > 5) return;

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อนให้คะแนน");
    return;
  }

  axios.post(`${supabaseUrl}/rest/v1/ratings`, {
    user_id: user.id,
    recipe_id: recipeId,
    rating: rating
  }, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    }
  }).then(() => {
    alert("ขอบคุณสำหรับคะแนน!");
    loadAllRecipes();
  }).catch(err => {
    if (err.response?.status === 409) {
      alert("คุณให้คะแนนเมนูนี้ไปแล้ว");
    } else {
      alert("เกิดข้อผิดพลาด");
    }
  });
}

// === ลงทะเบียนผู้ใช้ ===
function registerUser() {
  const data = {
    fullname: document.getElementById('gf-fullname').value,
    age: parseInt(document.getElementById('gf-age').value),
    occupation: document.getElementById('gf-occupation').value,
    email: document.getElementById('gf-email').value,
    birthdate: document.getElementById('gf-birthdate').value,
    password: document.getElementById('gf-password').value,
    created_at: new Date().toISOString()
  };

  axios.post(`${supabaseUrl}/rest/v1/users`, data, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  })
  .then(() => {
    alert('ลงทะเบียนสำเร็จ');
    window.location.href = 'login.html';
  })
  .catch(err => {
    console.error('Register error:', err);
    alert('ลงทะเบียนไม่สำเร็จ');
  });
}

// === เข้าสู่ระบบ ===
function loginUser() {
  const email = document.getElementById('gf-login-email').value;
  const password = document.getElementById('gf-login-password').value;

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

// === สร้างเมนูอาหาร ===
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createRecipeForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนสร้างเมนู');
      window.location.href = 'login.html';
      return;
    }

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
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }
    }).then(() => {
      alert('เพิ่มเมนูอาหารสำเร็จ');
      window.location.href = 'profile.html';
    }).catch(err => {
      console.error('createRecipe error', err);
      alert('ไม่สามารถบันทึกเมนูได้ กรุณาลองใหม่');
    });
  });
});

// === เมื่อโหลดหน้า index
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();

  if (document.getElementById('recipesList')) {
    loadAllRecipes();
    document.getElementById('searchBox')?.addEventListener('input', loadAllRecipes);
    document.getElementById('filterSelect')?.addEventListener('change', loadAllRecipes);
  }
});
