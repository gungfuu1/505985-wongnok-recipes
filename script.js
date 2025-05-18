// Supabase config
const supabaseUrl = 'https://kiqgltbzomgteccozsfg.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcWdsdGJ6b21ndGVjY296c2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjAyMjIsImV4cCI6MjA2MzEzNjIyMn0.3wTMcOfYJYXAIshFjhQrpBdFUMS852NUzZNyPpqxbLM';
const supabase = axios.create({
  baseURL: supabaseUrl + '/rest/v1',
  headers: {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  },
});

// Fetch and display recipes
async function loadRecipes() {
  try {
    const { data, error } = await supabase.get('/recipes?select=*,users(fullname)');
    if (error) throw error;
    renderRecipes(data);
  } catch (err) {
    console.error('Error fetching recipes:', err);
  }
}

function renderRecipes(recipes) {
  const list = document.getElementById('recipesList');
  list.innerHTML = '';
  recipes.forEach(r => {
    const card = document.createElement('div');
    card.className = 'gf-card';
    card.innerHTML = `
      <img src="${r.image_url}" alt="${r.title}" />
      <div class="gf-card-content">
        <h3>${r.title}</h3>
        <p>${r.detail}</p>
        <p>
          <span class="gf-badge">★ ${r.rating || '-'} </span>
          <span class="gf-badge">${r.difficulty || 'ระดับ?'}</span>
        </p>
        <p class="gf-badge">${r.users?.fullname || 'ไม่ระบุผู้สร้าง'}</p>
      </div>
    `;
    list.appendChild(card);
  });
}

// Search/filter
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadRecipes();

  document.getElementById('searchBox').addEventListener('input', async e => {
    const keyword = e.target.value.toLowerCase();
    const { data } = await supabase.get('/recipes?select=*,users(fullname)');
    const filtered = data.filter(r =>
      r.title.toLowerCase().includes(keyword) ||
      r.ingredients.toLowerCase().includes(keyword)
    );
    renderRecipes(filtered);
  });

  document.getElementById('filterSelect').addEventListener('change', async e => {
    const value = e.target.value;
    let url = '/recipes?select=*,users(fullname)';
    let { data } = await supabase.get(url);

    switch (value) {
      case 'rating':
        data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'user':
        data.sort((a, b) => (a.users?.fullname || '').localeCompare(b.users?.fullname || ''));
        break;
      case 'views':
        data.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'cooking_time':
        data.sort((a, b) => (a.cooking_time || 0) - (b.cooking_time || 0));
        break;
    }
    renderRecipes(data);
  });
});

// Show/hide menu buttons
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user'));
  const loginBtn = document.getElementById('loginMenu');
  const createBtn = document.getElementById('createRecipeMenu');
  if (user) {
    loginBtn.innerText = 'ออกจากระบบ';
    loginBtn.onclick = () => {
      localStorage.removeItem('user');
      location.reload();
    };
    createBtn.style.display = 'inline-block';
  } else {
    loginBtn.innerText = 'เข้าสู่ระบบ';
    loginBtn.onclick = () => location.href = 'login.html';
    createBtn.style.display = 'none';
  }
}

// ✅ REGISTER
export async function registerUser() {
  const data = {
    fullname: document.getElementById('reg-fullname').value,
    age: parseInt(document.getElementById('reg-age').value),
    occupation: document.getElementById('reg-occupation').value,
    email: document.getElementById('reg-email').value,
    birthdate: document.getElementById('reg-birthdate').value,
    password: document.getElementById('reg-password').value,
    created_at: new Date().toISOString()
  };
  try {
    await supabase.post('/users', data);
    alert('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ');
    location.href = 'login.html';
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการลงทะเบียน');
    console.error(err);
  }
}

// ✅ LOGIN
export async function loginUser() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const { data } = await supabase.get(`/users?email=eq.${email}&password=eq.${password}`);
    if (data.length) {
      localStorage.setItem('user', JSON.stringify(data[0]));
      alert('เข้าสู่ระบบสำเร็จ');
      location.href = 'index.html';
    } else {
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    console.error(err);
  }
}

// ✅ CREATE RECIPE
export async function createRecipe() {
  const user = JSON.parse(localStorage.getItem('user'));
  const data = {
    user_id: user.id,
    title: document.getElementById('recipe-title').value,
    detail: document.getElementById('recipe-detail').value,
    ingredients: document.getElementById('recipe-ingredients').value,
    steps: document.getElementById('recipe-steps').value,
    cooking_time: parseInt(document.getElementById('recipe-time').value),
    difficulty: document.getElementById('recipe-difficulty').value,
    image_url: document.getElementById('recipe-image').value,
    created_at: new Date().toISOString()
  };
  try {
    await supabase.post('/recipes', data);
    alert('เพิ่มเมนูสำเร็จ');
    location.href = 'index.html';
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการบันทึกเมนู');
    console.error(err);
  }
}

// ✅ LOAD USER RECIPES
export async function loadUserRecipes(userId) {
  try {
    const { data } = await supabase.get(`/recipes?user_id=eq.${userId}`);
    const list = document.getElementById('userRecipes');
    list.innerHTML = '';
    data.forEach(r => {
      const card = document.createElement('div');
      card.className = 'gf-card';
      card.innerHTML = `
        <img src="${r.image_url}" alt="${r.title}" />
        <div class="gf-card-content">
          <h3>${r.title}</h3>
          <p>${r.detail}</p>
          <p>
            <span class="gf-badge">เวลา ${r.cooking_time} นาที</span>
            <span class="gf-badge">${r.difficulty}</span>
          </p>
          <button class="gf-button" onclick="deleteRecipe(${r.id})">ลบ</button>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('ไม่สามารถโหลดเมนูของผู้ใช้ได้', err);
  }
}

// ✅ DELETE RECIPE
export async function deleteRecipe(id) {
  if (!confirm('คุณแน่ใจว่าต้องการลบเมนูนี้?')) return;
  try {
    await supabase.delete(`/recipes?id=eq.${id}`);
    alert('ลบสำเร็จ');
    location.reload();
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการลบเมนู', err);
  }
}