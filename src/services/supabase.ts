import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client singleton (used only for database operations)
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (supabaseClient) {
		return supabaseClient;
	}

	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Missing Supabase credentials. Please check your .env file.');
	}

	// Simple client for database operations only (no auth)
	supabaseClient = createClient(supabaseUrl, supabaseKey);

	return supabaseClient;
}

// Database types
export interface User {
	id: string; // UUID primary key
	github_id: string; // GitHub user ID
	created_at: string;
	name: string | null;
	email: string;
	github: string | null;
}
