import { createClient } from "@supabase/supabase-js";

export default function supabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_ADMIN ?? process.env.SUPABAE_ADMIN; // support both spellings
	if (!url || !key) {
		throw new Error('Supabase admin: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ADMIN (or SUPABAE_ADMIN) in .env.local');
	}
	return createClient(url, key,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		}
	);
}
