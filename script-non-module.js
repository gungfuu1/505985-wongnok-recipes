// === Supabase config ===
const supabaseUrl = 'https://kiqgltbzomgteccozsfg.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcWdsdGJ6b21ndGVjY296c2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjAyMjIsImV4cCI6MjA2MzEzNjIyMn0.3wTMcOfYJYXAIshFjhQrpBdFUMS852NUzZNyPpqxbLM';

// === เช็คสถานะล็อกอิน ===
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user'));
  const loginMenu = document.getElementById('loginMenu');
  const createMenu = document.getElementById('createRecipeMenu');
  const registerMenu = document.getElementById('registerMenu');
  const profileMenu = document.getElementById('profileMenu');

  if (user) {
    // เปลี่ยนปุ่ม login เป็น logout
    loginMenu.textContent = 'ออกจากระบบ';
    loginMenu.onclick = () => {
      localStorage.removeItem('user');
      location.href = 'index.html';
    };

    if (createMenu) createMenu.style.display = 'inline-block';
    if (registerMenu) registerMenu.style.display = 'none';
    if (profileMenu) profileMenu.style.display = 'inline-block';
  } else {
    loginMenu.textContent = 'เข้าสู่ระบบ';
    loginMenu.onclick = () => location.href = 'login.html';

    if (createMenu) createMenu.style.display = 'none';
    if (registerMenu) registerMenu.style.display = 'inline-block';
    if (profileMenu) profileMenu.style.display = 'none';
  }
}

// === โหลดเมนูอาหารทั้งหมด ===
async function loadAllRecipes() {
  try {
    const keyword = document.getElementById('searchBox')?.value?.toLowerCase() || '';
    const filter = document.getElementById('filterSelect')?.value || '';

    const res = await axios.get(`${supabaseUrl}/rest/v1/recipes?select=*,users(fullname),ratings(rating)`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!res.data) throw new Error('ไม่พบข้อมูล');

    let recipes = res.data;

    // Filter ด้วย keyword
    if (keyword) {
      recipes = recipes.filter(r =>
        (r.title && r.title.toLowerCase().includes(keyword)) ||
        (r.ingredients && r.ingredients.toLowerCase().includes(keyword)) ||
        (r.users?.fullname && r.users.fullname.toLowerCase().includes(keyword))
      );
    }

    // คำนวณ rating
    recipes = recipes.map(r => {
      const ratings = r.ratings || [];
      const avg = ratings.length
        ? ratings.reduce((sum, it) => sum + it.rating, 0) / ratings.length
        : 0;
      return { ...r, rating_avg: avg };
    });

    // Sort
    if (filter === 'rating') {
      recipes.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (filter === 'cooking_time') {
      recipes.sort((a, b) => a.cooking_time - b.cooking_time);
    }

    // Render
    const list = document.getElementById('recipesList');
    list.innerHTML = recipes.map(r => {
      const avg = r.rating_avg ? r.rating_avg.toFixed(1) : "ยังไม่มี";
      const user = JSON.parse(localStorage.getItem('user'));
      const canRate = user && user.id !== r.user_id;
      return `
  <div class="gf-third gf-margin-bottom">
    <div class="gf-card-4 gf-card-fixed" onclick="window.location.href='recipe_detail.html?id=${r.id}'" style="cursor:pointer">
      <img src="${r.image_url}" style="width:100%">
      <div class="gf-container gf-card-body">
        <div>
          <h4><b>${r.title}</b></h4>
          <p class="gf-truncate-3">${r.detail || ''}</p>
        </div>
        <div>
          <p>⭐ ${avg} (${r.ratings?.length || 0} โหวต)</p>
          <p>👤 โดย ${r.users?.fullname || 'ไม่ทราบชื่อ'}</p>
        </div>
      </div>
    </div>
  </div>
`;
    }).join('');

  } catch (err) {
    console.error("loadAllRecipes error", err);
  }
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


// โหลดเมนูของฉัน
function loadUserRecipes() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;

  axios.get(`${supabaseUrl}/rest/v1/recipes?user_id=eq.${user.id}&order=created_at.desc`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => {
    const list = document.getElementById('userRecipeList');
    list.innerHTML = res.data.map(r => `
      <div class="gf-third gf-container gf-margin-bottom">
        <div class="gf-card-4">
          <img src="${r.image_url}" alt="${r.title}" style="width:100%">
          <div class="gf-container">
            <h3>${r.title}</h3>
            <p>${r.detail || ''}</p>
            <button class="gf-button gf-yellow" onclick='openEditModal(${JSON.stringify(r)})'>แก้ไข</button>
            <button class="gf-button gf-red" onclick="deleteRecipe(${r.id})">ลบ</button>
          </div>
        </div>
      </div>
    `).join('');
  });
}

// ลบเมนู
function deleteRecipe(id) {
  if (!confirm("ต้องการลบสูตรอาหารนี้ใช่หรือไม่?")) return;

  axios.delete(`${supabaseUrl}/rest/v1/recipes?id=eq.${id}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(() => {
    alert("ลบเมนูแล้ว");
    loadUserRecipes();
  });
}

// เปิด modal แก้ไข
function openEditModal(recipe) {
  document.getElementById('editModal').style.display = 'block';
  document.getElementById('editId').value = recipe.id;
  document.getElementById('editTitle').value = recipe.title;
  document.getElementById('editDetail').value = recipe.detail;
  document.getElementById('editIngredients').value = recipe.ingredients;
  document.getElementById('editSteps').value = recipe.steps;
  document.getElementById('editCookingTime').value = recipe.cooking_time;
  document.getElementById('editImageUrl').value = recipe.image_url;
}

// ปิด modal แก้ไข
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

// แก้ไขแล้วบันทึก
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('editForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const id = document.getElementById('editId').value;
      const data = {
        title: document.getElementById('editTitle').value,
        detail: document.getElementById('editDetail').value,
        ingredients: document.getElementById('editIngredients').value,
        steps: document.getElementById('editSteps').value,
        cooking_time: parseInt(document.getElementById('editCookingTime').value),
        image_url: document.getElementById('editImageUrl').value
      };

      axios.patch(`${supabaseUrl}/rest/v1/recipes?id=eq.${id}`, data, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }).then(() => {
        alert("อัปเดตเรียบร้อยแล้ว");
        closeEditModal();
        loadUserRecipes();
      });
    });
  }

  const list = document.getElementById('userRecipeList');
  if (list) {
    loadUserRecipes();
  }
});


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

// ลงทะเบียน
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



// === เรียกเมื่อโหลด ===
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  const recipeList = document.getElementById('recipesList');
  if (recipeList) {
    loadAllRecipes();
    document.getElementById('searchBox')?.addEventListener('input', loadAllRecipes);
    document.getElementById('filterSelect')?.addEventListener('change', loadAllRecipes);
  }
});
