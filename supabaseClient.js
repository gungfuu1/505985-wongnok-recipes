import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://asooyypcnuxtaxzosvaa.supabase.co/rest/v1';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb295eXBjbnV4dGF4em9zdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Nzk1MjAsImV4cCI6MjA2MzA1NTUyMH0.KUc401gp9ITSU4q_LHKFwzD0LFhL0rUxs-SVk2ZFpTQ';
export const supabase = createClient(supabaseUrl, supabaseKey);
