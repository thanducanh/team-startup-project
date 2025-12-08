// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Thay 2 dòng dưới đây bằng thông tin thật của bạn
const supabaseUrl = 'https://hgbfgqxahpfgifaxklft.supabase.co';
const supabaseKey = 'sb_publishable_eGhhvuke7hPA3jGQ2wjKKg_a8U6K5no';

export const supabase = createClient(supabaseUrl, supabaseKey);