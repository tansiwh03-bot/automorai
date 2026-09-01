import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwettpkioulkofohfdxl.supabase.co';
const supabaseAnonKey = 'sb_publishable_ul461fEnojpr4GxdJv-P8Q_hySiflQt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
