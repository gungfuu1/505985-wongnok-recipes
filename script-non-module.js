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
  const userGreeting = document.getElementById('userGreeting');

  if (user) {
    loginMenu.textContent = 'ออกจากระบบ';
    loginMenu.onclick = () => {
      localStorage.removeItem('user');
      location.href = 'index.html';
    };

    if (createMenu) createMenu.style.display = 'inline-block';
    if (registerMenu) registerMenu.style.display = 'none';
    if (profileMenu) profileMenu.style.display = 'inline-block';

    if (userGreeting) {
      userGreeting.textContent = `สวัสดี, ${user.fullname}`;
      userGreeting.style.display = 'inline';
    }
  } else {
    loginMenu.textContent = 'เข้าสู่ระบบ';
    loginMenu.onclick = () => location.href = 'login.html';

    if (createMenu) createMenu.style.display = 'none';
    if (registerMenu) registerMenu.style.display = 'inline-block';
    if (profileMenu) profileMenu.style.display = 'none';

    if (userGreeting) {
      userGreeting.textContent = '';
      userGreeting.style.display = 'none';
    }
  }
}


// toggle menu สำหรับ tablet และ smartphone
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("gf-show");
}



// === โหลดเมนูทั้งหมด ===
async function loadAllRecipes() {
  try {
    const keyword = document.getElementById('searchBox')?.value?.toLowerCase() || '';
    const filter = document.getElementById('filterSelect')?.value || '';

    const { data } = await axios.get(`${supabaseUrl}/rest/v1/recipes?select=*,users(fullname),ratings(rating)`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`
      }
    });

    let recipes = data.map(r => {
      const ratings = r.ratings || [];
      const avg = ratings.length ? ratings.reduce((sum, it) => sum + it.rating, 0) / ratings.length : 0;
      return { ...r, rating_avg: avg };
    });

    if (keyword) {
      recipes = recipes.filter(r =>
        (r.title?.toLowerCase().includes(keyword)) ||
        (r.ingredients?.toLowerCase().includes(keyword)) ||
        (r.users?.fullname?.toLowerCase().includes(keyword))
      );
    }

    if (filter === 'rating') {
      recipes.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (filter === 'cooking_time') {
      recipes.sort((a, b) => a.cooking_time - b.cooking_time);
    }

    const list = document.getElementById('recipesList');
    list.innerHTML = recipes.map(r => {
      const avg = r.rating_avg ? r.rating_avg.toFixed(1) : "ยังไม่มี";
      const user = JSON.parse(localStorage.getItem('user'));
      const canRate = user && user.id !== r.user_id;

      return `
        <div class="gf-third gf-margin-bottom">
          <div class="gf-card-4 gf-card-fixed">
            <a href="recipe_detail.html?id=${r.id}" style="text-decoration:none;color:inherit">
              <img src="${r.image_url}" alt="${r.title}" style="width:100%">
              <div class="gf-container gf-card-body">
                <h3><b>${r.title}</b></h3>
                <p class="gf-truncate-3">${r.detail || ''}</p>
                <p>⏲️ เวลาปรุง: ${r.cooking_time || '-'} นาที</p>
                <p>⭐ ${avg} (${r.ratings?.length || 0} โหวต)</p>
                <p>👤 โดย ${r.users?.fullname || 'ไม่ทราบชื่อ'}</p>
              </div>
            </a>
            
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("loadAllRecipes error", err);
  }
}

// === ให้คะแนนเมนู ===
function submitRating(recipeId, value) {
  const rating = parseInt(value);
  if (!rating || rating < 1 || rating > 5) return;
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("กรุณาเข้าสู่ระบบ");

  axios.post(`${supabaseUrl}/rest/v1/ratings`, {
    user_id: user.id,
    recipe_id: recipeId,
    rating
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

// === โหลดเมนูของฉัน ===
function loadUserRecipes() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนดูเมนูของคุณ');
    window.location.href = 'login.html';
    return;
  }

  axios.get(`${supabaseUrl}/rest/v1/recipes?user_id=eq.${user.id}&order=created_at.desc`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => {
    const list = document.getElementById('userRecipeList');
    if (!res.data.length) {
      list.innerHTML = '<p>ยังไม่มีเมนูของคุณ</p>';
      return;
    }
     
  
    list.innerHTML = res.data.map(r => `
  <div class="gf-third gf-container gf-margin-bottom">
    <a href="recipe_detail.html?id=${r.id}" style="text-decoration:none; color:inherit;">
      <div class="gf-card-4" >
        <img src="${r.image_url}" alt="${r.title}" style="width:100%">
        <div class="gf-container">
          <h3>${r.title}</h3>
          <p>${r.detail || ''}</p>
        </div>
      </div>
    </a>
    <button class="gf-button gf-yellow" onclick='openEditModal(${JSON.stringify(r)})'>แก้ไข</button>
    <button class="gf-button gf-red" onclick="deleteRecipe(${r.id})">ลบ</button>
  </div>
`).join('');

  }).catch(err => {
    console.error('loadUserRecipes error', err);
  });
}


// === ลบเมนู ===
function deleteRecipe(id) {
  if (!confirm("ต้องการลบเมนูนี้?")) return;

  axios.delete(`${supabaseUrl}/rest/v1/recipes?id=eq.${id}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(() => {
    alert("ลบสำเร็จ");
    loadUserRecipes();
  });
}

// === เปิด/ปิด modal แก้ไข ===
function openEditModal(r) {
  document.getElementById('editModal').style.display = 'block';
  document.getElementById('editId').value = r.id;
  document.getElementById('editTitle').value = r.title;
  document.getElementById('editDetail').value = r.detail;
  document.getElementById('editIngredients').value = r.ingredients;
  document.getElementById('editSteps').value = r.steps;
  document.getElementById('editCookingTime').value = r.cooking_time;
  document.getElementById('editImageUrl').value = r.image_url;
}
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

// === Submit แก้ไขเมนู ===
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('editForm');
  if (form) {
    form.addEventListener('submit', e => {
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
        alert("อัปเดตแล้ว");
        closeEditModal();
        loadUserRecipes();
      });
    });
  }

  const userRecipeList = document.getElementById('userRecipeList');
  if (userRecipeList) loadUserRecipes();
});

// === ลงทะเบียน และตรวจสอบข้อมูลครบ===
function validateRegisterForm() {
  const fullname = document.getElementById('gf-fullname').value.trim();
  const age = document.getElementById('gf-age').value.trim();
  const occupation = document.getElementById('gf-occupation').value.trim();
  const email = document.getElementById('gf-email').value.trim();
  const birthdate = document.getElementById('gf-birthdate').value.trim();
  const password = document.getElementById('gf-password').value.trim();

  if (!fullname || !age || !occupation || !email || !birthdate || !password) {
    alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    return false;
  }

  if (isNaN(age) || age <= 0) {
    alert('กรุณากรอกอายุเป็นตัวเลขที่ถูกต้อง');
    return false;
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง');
    return false;
  }

  return true;
}

function registerUser() {
  if (!validateRegisterForm()) return;

  const data = {
    fullname: document.getElementById('gf-fullname').value.trim(),
    age: parseInt(document.getElementById('gf-age').value),
    occupation: document.getElementById('gf-occupation').value.trim(),
    email: document.getElementById('gf-email').value.trim(),
    birthdate: document.getElementById('gf-birthdate').value.trim(),
    password: document.getElementById('gf-password').value.trim(),
    created_at: new Date().toISOString()
  };

  axios.post(`${supabaseUrl}/rest/v1/users`, data, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  }).then(() => {
    alert("ลงทะเบียนสำเร็จ");
    window.location.href = 'login.html';
  }).catch(err => {
    console.error("Register error", err);
    alert("ลงทะเบียนไม่สำเร็จ");
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
  }).then(res => {
    const users = res.data;
    if (users.length > 0) {
      localStorage.setItem('user', JSON.stringify(users[0]));
      alert("เข้าสู่ระบบสำเร็จ");
      window.location.href = 'index.html';
    } else {
      alert("Email หรือ Password ไม่ถูกต้อง");
    }
  }).catch(err => {
    console.error("Login error", err);
    alert("เกิดข้อผิดพลาด");
  });
}


// ฟังก์ชันโหลดข้อมูลผู้ใช้ที่ล็อกอินมาแสดง
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('User from localStorage:', user);
  const userInfoDiv = document.getElementById('userInfo');
  
  if (!user) {
    userInfoDiv.innerHTML = '<p>กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์</p>';
    return;
  }
    // แสดงข้อมูลผู้ใช้แบบง่ายๆ
  userInfoDiv.innerHTML = `
    
    <div class="gf-user-box">
    <h2 class="gf-title">ข้อมูลผู้ใช้</h2>
    <p><b>ชื่อ-สกุล:</b> ${user.fullname || '-'}</p>
    <p><b>อายุ:</b> ${user.age || '-'}</p>
    <p><b>อาชีพ:</b> ${user.occupation || '-'}</p>
    <p><b>Email:</b> ${user.email || '-'}</p>
    <p><b>วันเกิด:</b> ${user.birthdate || '-'}</p>
    </div>
  `;
}

// สร้างเมนูอาหาร
function validateCreateRecipeForm() {
  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value.trim();
  const steps = document.getElementById('steps').value.trim();
  const cooking_time = document.getElementById('cookingTime').value.trim();


  if (!title || !ingredients || !steps || !cooking_time) {
    alert('กรุณากรอกชื่อเมนู วัตถุดิบ ขั้นตอนการทำ และระยะเวลาในการปรุงให้ครบ');
    return false;
  }

  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createRecipeForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateCreateRecipeForm()) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนสร้างเมนู');
        window.location.href = 'login.html';
        return;
      }

      const data = {
        title: document.getElementById('title').value.trim(),
        detail: document.getElementById('detail').value.trim(),
        ingredients: document.getElementById('ingredients').value.trim(),
        steps: document.getElementById('steps').value.trim(),
        cooking_time: parseInt(document.getElementById('cookingTime').value) || 0,
        difficulty: document.getElementById('difficulty').value,
        image_url: document.getElementById('imageUrl').value.trim(),
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      try {
        await axios.post(`${supabaseUrl}/rest/v1/recipes`, data, {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          }
        });
        alert('เพิ่มเมนูอาหารสำเร็จ');
        window.location.href = 'profile.html';
      } catch (err) {
        console.error('createRecipe error', err);
        alert('ไม่สามารถบันทึกเมนูได้ กรุณาลองใหม่');
      }
    });
  }
});



 const params = new URLSearchParams(window.location.search);
 const recipeId = params.get('id');
//เช็คว่ามี element ก่อนเรียก .innerHTML
  document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();

  const detailDiv = document.getElementById('recipeDetail');
  if (detailDiv) {
    if (recipeId) {
      loadRecipeDetail();
    } else {
      detailDiv.innerHTML = '<p>ไม่พบเมนู</p>';
    }
  }

  if (document.getElementById('recipesList')) {
    loadAllRecipes();
    document.getElementById('searchBox')?.addEventListener('input', loadAllRecipes);
    document.getElementById('filterSelect')?.addEventListener('change', loadAllRecipes);
  }

  if (document.getElementById('userInfo')) {
    loadUserInfo();
  }

  if (document.getElementById('userRecipeList')) {
    loadUserRecipes();
  }
});

  async function loadRecipeDetail() {
    try {
      const { data } = await axios.get(`${supabaseUrl}/rest/v1/recipes?select=*,users(fullname),ratings(rating)&id=eq.${recipeId}`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`
        }
      });

      const recipe = data[0];
      const user = JSON.parse(localStorage.getItem('user'));
      const avg = recipe.ratings?.length
        ? (recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length).toFixed(1)
        : "ยังไม่มี";

      const isOwner = user && user.id === recipe.user_id;

      let html = `
        <h2>${recipe.title}</h2>
        <img src="${recipe.image_url}" style="max-width:100%; margin:10px 0">
        <p><b>รายละเอียด:</b> ${recipe.detail}</p>
        <p><b>วัตถุดิบ:</b> ${recipe.ingredients}</p>
        <p><b>ขั้นตอนการทำ:</b> ${recipe.steps}</p>
        <p><b>เวลาปรุง:</b> ${recipe.cooking_time} นาที</p>
        <p><b>ระดับความยาก:</b> ${recipe.difficulty}</p>
        <p><b>คะแนนเฉลี่ย:</b> ⭐ ${avg} (${recipe.ratings?.length || 0} โหวต)</p>
        <p><b>โดย:</b> ${recipe.users?.fullname || 'ไม่ทราบชื่อ'}</p>
      `;

      if (user && !isOwner) {
        html += `
          <label for="rateSelect"><b>ให้คะแนน:</b></label>
          <select id="rateSelect" onchange="submitRating(${recipe.id}, this.value)">
            <option value="">เลือกดาว</option>
            <option value="1">1 ดาว</option>
            <option value="2">2 ดาว</option>
            <option value="3">3 ดาว</option>
            <option value="4">4 ดาว</option>
            <option value="5">5 ดาว</option>
          </select>
        `;
      }

      if (isOwner) {
        html += `<br><br><a class="gf-button gf-yellow" href="profile.html">แก้ไขเมนูนี้</a>`;
      }

      document.getElementById('recipeDetail').innerHTML = html;

      // เรียก load เมนูอื่น ๆ จากผู้ใช้เดียวกัน โดยส่ง user_id ที่ถูกต้อง
      loadOtherMenus(recipe.user_id, recipe.id);

    } catch (err) {
      console.error("loadRecipeDetail error", err);
      alert("ไม่พบเมนูหรือโหลดข้อมูลผิดพลาด");
    }
  }

  async function loadOtherMenus(userId, excludeId) {
    try {
      if (!userId) {
        document.getElementById('relatedRecipes').innerHTML = '<p>ไม่มีเมนูอื่น</p>';
        return;
      }

      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/recipes?select=id,title,image_url,ratings(rating)&user_id=eq.${userId}&id=neq.${excludeId}`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      // จัดเรียงตาม rating และจำกัด 3 รายการ
      const sorted = data.map(r => {
        const ratings = r.ratings || [];
        const avg = ratings.length ? ratings.reduce((sum, x) => sum + x.rating, 0) / ratings.length : 0;
        return { ...r, rating_avg: avg };
      }).sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 3);

      const html = sorted.map(r => `
        <div class="gf-third gf-margin-bottom">
          <div class="gf-card-4 gf-card-fixed">
            <img src="${r.image_url}" style="width:100%">
            <div class="gf-container gf-card-body">
              <h4>${r.title}</h4>
              <a href="recipe_detail.html?id=${r.id}" class="gf-button">ดูเพิ่มเติม</a>
            </div>
          </div>
        </div>
      `).join('');

      document.getElementById('relatedRecipes').innerHTML = html || '<p>ไม่มีเมนูอื่น</p>';

    } catch (err) {
      console.error("loadOtherMenus error", err);
      document.getElementById('relatedRecipes').innerHTML = '<p>ไม่สามารถโหลดเมนูอื่นได้</p>';
    }
  }




// === DOM Loaded: Apply login check & Load index ===
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();

  if (document.getElementById('recipesList')) {
    loadAllRecipes();
    document.getElementById('searchBox')?.addEventListener('input', loadAllRecipes);
    document.getElementById('filterSelect')?.addEventListener('change', loadAllRecipes);
  }

  if (document.getElementById('userInfo')) {
    loadUserInfo();
  }

  if (document.getElementById('userRecipeList')) {
    loadUserRecipes();
  }
});
