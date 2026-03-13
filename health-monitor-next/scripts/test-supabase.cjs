/**
 * Test script: verify Supabase connection and parts used by the chat route.
 * - Anon client (auth / getUser in route)
 * - Admin client + execute_sql RPC (querySupabase tool in chat)
 * - conversations / messages (chat persistence)
 * Run: node scripts/test-supabase.cjs
 */
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) process.env[key] = val;
  });
}
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const adminKey = process.env.SUPABASE_ADMIN?.trim() || process.env.SUPABAE_ADMIN?.trim();

console.log('=== Supabase connection test (route-relevant) ===\n');

if (!url || !anonKey) {
  console.error('FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

console.log('URL:', url);
console.log('Anon key:', anonKey ? `${anonKey.slice(0, 12)}...` : '(missing)');
console.log('Admin key:', adminKey ? `${adminKey.slice(0, 12)}...` : '(missing – chat querySupabase tool needs SUPABASE_ADMIN or SUPABAE_ADMIN)');
console.log('');

const supabase = createClient(url, anonKey);
const supabaseAdmin = adminKey ? createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

async function run() {
  const results = { ok: [], fail: [] };
  try {
    // --- Anon client (used by route for getUser via createSupabaseServer) ---
    console.log('--- Anon client (auth / getUser) ---');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('auth.getSession:', authError.message, '(no session in script is OK)');
      results.ok.push('anon_connect');
    } else {
      console.log('auth.getSession: OK', authData?.session ? '(session present)' : '(no session)');
      results.ok.push('anon_connect');
    }

    // --- Tables used by app ---
    const { error: sensorError } = await supabase.from('sensor_data').select('id').limit(1);
    if (sensorError) console.log('sensor_data:', sensorError.message);
    else { console.log('sensor_data: OK'); results.ok.push('sensor_data'); }

    const { error: nutritionError } = await supabase.from('daily_nutrition').select('id').limit(1);
    if (nutritionError) console.log('daily_nutrition:', nutritionError.message);
    else { console.log('daily_nutrition: OK'); results.ok.push('daily_nutrition'); }

    // --- Chat route: conversations / messages (chat persistence) ---
    console.log('\n--- Chat tables (conversations / messages) ---');
    const { data: convData, error: convError } = await supabase.from('conversations').select('id').limit(1);
    if (convError) {
      console.log('conversations:', convError.message);
      results.fail.push('conversations');
    } else {
      console.log('conversations: OK', 'rows:', convData?.length ?? 0);
      results.ok.push('conversations');
    }
    const { data: msgData, error: msgError } = await supabase.from('messages').select('id').limit(1);
    if (msgError) {
      console.log('messages:', msgError.message);
      results.fail.push('messages');
    } else {
      console.log('messages: OK', 'rows:', msgData?.length ?? 0);
      results.ok.push('messages');
    }

    // --- Chat route: querySupabase tool uses admin client + execute_sql RPC ---
    console.log('\n--- Admin client + execute_sql (querySupabase tool) ---');
    if (!supabaseAdmin) {
      console.log('Admin client: SKIP (no SUPABASE_ADMIN / SUPABAE_ADMIN)');
      results.fail.push('admin_missing');
    } else {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('execute_sql', { query: 'SELECT 1 as test' });
      if (rpcError) {
        console.log('execute_sql RPC:', rpcError.message);
        results.fail.push('execute_sql');
      } else {
        console.log('execute_sql RPC: OK', rpcData != null ? '(result received)' : '');
        results.ok.push('execute_sql');
      }
    }

    // --- Summary ---
    console.log('\n--- Summary ---');
    console.log('OK:', results.ok.join(', ') || 'none');
    if (results.fail.length) console.log('FAIL / missing:', results.fail.join(', '));
    const criticalOk = results.ok.includes('anon_connect') && (results.ok.includes('conversations') || results.ok.includes('messages') || results.ok.includes('sensor_data'));
    const allOk = results.fail.length === 0;
    if (allOk) {
      console.log('\nSUCCESS: Supabase is OK for the chat route (anon, chat tables, and execute_sql if used).');
    } else if (criticalOk) {
      console.log('\nPARTIAL: Connection and some tables work. Fix missing items above if chat or tools fail.');
    } else {
      console.log('\nFAIL: Fix missing URL/keys or tables (see chat-tables.sql for conversations/messages).');
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  }
}

run();
