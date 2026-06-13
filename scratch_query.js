import { getSupabase } from './server/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = getSupabase();
if (!supabase) {
  console.log("Supabase client is null");
  process.exit(1);
}

const { data, error } = await supabase.from('schemes').select('id, name, apply_link').limit(50);
if (error) {
  console.error("Error fetching:", error);
} else {
  console.log("Fetched schemes count:", data.length);
  console.log(JSON.stringify(data, null, 2));
}
process.exit(0);
