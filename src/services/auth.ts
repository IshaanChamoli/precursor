import * as vscode from 'vscode';
import { getSupabaseClient, User } from './supabase';

interface GitHubUser {
	login: string;
	id: number;
	email: string | null;
	name: string | null;
	avatar_url: string;
}

export class AuthService {
	private context: vscode.ExtensionContext;
	private onAuthStateChangedEmitter = new vscode.EventEmitter<void>();
	public readonly onAuthStateChanged = this.onAuthStateChangedEmitter.event;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * Initiates GitHub login using VSCode's built-in authentication
	 */
	async login(): Promise<void> {
		try {
			console.log('Login button clicked');

			// Check if already logged in
			const existingUser = await this.getCurrentUser();
			console.log('Existing user check:', existingUser);

			if (existingUser) {
				console.log('User already logged in, showing message');
				vscode.window.showInformationMessage(`Already logged in as ${existingUser.email}`);
				return;
			}

			console.log('No existing user, starting GitHub auth');

			// Use VSCode's built-in GitHub authentication
			const session = await vscode.authentication.getSession(
				'github',
				['user:email', 'read:user'],
				{ createIfNone: true }
			);

			console.log('GitHub session obtained:', session ? 'Yes' : 'No');

			if (session) {
				// Get user info from GitHub API
				const githubUser = await this.getGitHubUser(session.accessToken);
				console.log('GitHub user data:', githubUser);

				// Store user in Supabase database
				await this.storeUserInDatabase(githubUser, session);
				console.log('User stored in database');

				// Notify listeners that auth state changed
				this.onAuthStateChangedEmitter.fire();
				console.log('Auth state changed event fired');
			}
		} catch (error) {
			console.error('Login error:', error);
			vscode.window.showErrorMessage(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Fetch user data from GitHub API
	 */
	private async getGitHubUser(accessToken: string): Promise<GitHubUser> {
		const response = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch GitHub user data');
		}

		return await response.json();
	}

	/**
	 * Store user in Supabase database
	 */
	private async storeUserInDatabase(githubUser: GitHubUser, session: vscode.AuthenticationSession): Promise<void> {
		const supabase = getSupabaseClient();

		// Store session info in VSCode secrets
		await this.context.secrets.store('github_access_token', session.accessToken);
		await this.context.secrets.store('github_user_id', githubUser.id.toString());

		// Upsert user in Supabase database using github_id
		const { error } = await supabase
			.from('users')
			.upsert({
				github_id: githubUser.id.toString(),
				name: githubUser.name,
				email: githubUser.email,
				github: githubUser.login
			}, {
				onConflict: 'github_id'
			});

		if (error) {
			console.error('Error storing user in database:', error);
		}
	}

	/**
	 * Get current user from VSCode session
	 */
	async getCurrentUser(): Promise<User | null> {
		try {
			// Try to get existing GitHub session from VSCode
			const session = await vscode.authentication.getSession(
				'github',
				['user:email', 'read:user'],
				{ createIfNone: false }
			);

			console.log('GitHub session:', session ? 'Found' : 'Not found');

			if (!session) {
				return null;
			}

			// Get GitHub user ID from stored secrets
			const githubUserId = await this.context.secrets.get('github_user_id');
			console.log('GitHub user ID from secrets:', githubUserId);

			if (!githubUserId) {
				console.log('No stored GitHub user ID, treating as not logged in');
				return null;
			}

			// Get user data from Supabase database by github_id
			const supabase = getSupabaseClient();
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('*')
				.eq('github_id', githubUserId)
				.single();

			if (userError) {
				console.error('Error fetching user data:', userError);
				console.log('Database has no record for this user, treating as not logged in');
				// Clear the stored user ID since the database record doesn't exist
				await this.context.secrets.delete('github_user_id');
				return null;
			}

			console.log('User data from database:', userData);
			return userData;
		} catch (error) {
			console.error('Error getting current user:', error);
			return null;
		}
	}

	/**
	 * Check if user is authenticated
	 */
	async isAuthenticated(): Promise<boolean> {
		const user = await this.getCurrentUser();
		return user !== null;
	}
}
