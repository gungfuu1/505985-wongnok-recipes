import { supabase } from './supabaseClient.js';

// สมัครสมาชิก
export async function registerUser(userData) {
    const { data, error } = await supabase
        .from('users')
        .insert([userData]);

    if (error) throw error;
    return data;
}

// เข้าสู่ระบบ (ดึง user โดย email และ password แบบง่ายๆ)
export async function loginUser(email, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error) throw error;
    return data;
}

// สร้างเมนูอาหาร (ต้องมี user_id)
export async function createRecipe(recipeData) {
    const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData]);

    if (error) throw error;
    return data;
}

// ให้คะแนนเมนู (rating 1-5)
export async function rateRecipe(userId, recipeId, ratingValue) {
    // เช็คว่าผู้ใช้คนนี้เคยให้คะแนนเมนูนี้หรือยัง
    const { data: existing } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

    if (existing) throw new Error('คุณได้ให้คะแนนเมนูนี้ไปแล้ว');

    // ดำเนินการให้คะแนน
    const { data, error } = await supabase
        .from('ratings')
        .insert([{
            user_id: userId,
            recipe_id: recipeId,
            rating: ratingValue
        }]);

    if (error) throw error;
    return data;
}

// ดึงเมนูอาหารทั้งหมด พร้อมจำนวน view, rating เฉลี่ย (ใช้ view raw SQL หรือ view table ได้)
export async function listRecipes() {
    const { data, error } = await supabase
        .from('recipes')
        .select('*, users(fullname), ratings(rating)');

    if (error) throw error;
    return data;
}

// ค้นหาเมนูจากชื่อเมนูหรือวัตถุดิบ
export async function searchRecipes(keyword) {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .or(`title.ilike.%${keyword}%,ingredients.ilike.%${keyword}%`);

    if (error) throw error;
    return data;
}
