import { createClient } from '@supabase/supabase-js';

const url = 'https://icbsxmrmorkdgxtumamu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk';

const supabase = createClient(url, key);

async function testLogin() {
  console.log('Testing Supabase auth...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'vaa33053@gmail.com',
      password: 'Vi30833491@'
    });
    
    if (error) {
      console.log('❌ Auth error:', error.message);
    } else {
      console.log('✅ Auth success! User:', data.user?.email);
    }
  } catch (e) {
    console.log('❌ Exception:', (e as any).message);
  }
}

testLogin();
