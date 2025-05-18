
// === Supabase config ===
const supabaseUrl = 'https://kiqgltbzomgteccozsfg.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcWdsdGJ6b21ndGVjY296c2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NjAyMjIsImV4cCI6MjA2MzEzNjIyMn0.3wTMcOfYJYXAIshFjhQrpBdFUMS852NUzZNyPpqxbLM'; // <--- แก้ไขเป็นของจริงหากตัดสั้น

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

// === โหลดเมนูอาหารทั้งหมด ===
function loadAllRecipes() {
  axios.get(`${supabaseUrl}/rest/v1/recipes?select=*,ratings(rating)`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  }).then(res => {
    const list = document.getElementById('recipesList');
    list.innerHTML = res.data.map(r => {
      const ratings = r.ratings || [];
      const avg = ratings.length
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : "ยังไม่มี";

      const user = JSON.parse(localStorage.getItem('user'));
      const canRate = user && user.id !== r.user_id;

      return `
        <div class="gf-third gf-margin-bottom">
          <div class="gf-card-4">
            <img src="${r.image_url}" style="width:100%">
            <div class="gf-container">
              <h4><b>${r.title}</b></h4>
              <p>${r.detail || ''}</p>
              <p>⭐ ${avg} (${ratings.length} โหวต)</p>
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

// === เรียกเมื่อโหลด ===
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  const recipeList = document.getElementById('recipesList');
  if (recipeList) {
    loadAllRecipes();

    document.getElementById('searchBox')?.addEventListener('input', () => {
      loadAllRecipes();
    });
    document.getElementById('filterSelect')?.addEventListener('change', () => {
      loadAllRecipes();
    });
  }
});
