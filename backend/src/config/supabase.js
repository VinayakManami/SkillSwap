const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

/**
 * Supabase client singleton
 * Used for all database operations
 */
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false }, // Server-side, no session persistence needed
});

module.exports = supabase;
