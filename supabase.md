# Supabase Setup Guide - Precursor Extension

## 🎯 What We're Setting Up

- **Supabase Auth** with GitHub OAuth
- **Automatic user creation** in custom `public.users` table when someone signs up
- **VSCode extension** integration

---

## 📋 Step 1: Environment Variables

Add these to your `.env` file:

```bash
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
```

### Where to find these values:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

---

## 🗄️ Step 2: Database Setup

Run this SQL in your Supabase SQL Editor:

### A. Create the `public.users` table

```sql
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  github TEXT
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
```

### B. Create trigger to auto-populate users table

```sql
-- Function to create user in public.users when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, github)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute function after user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔐 Step 3: GitHub OAuth Setup

### A. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `Precursor VSCode Extension`
   - **Homepage URL**: `https://your-project.supabase.co`
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`

     ⚠️ **IMPORTANT**: Replace `your-project` with your actual Supabase project reference ID

     Example: If your Supabase URL is `https://abcdefgh.supabase.co`, use:
     ```
     https://abcdefgh.supabase.co/auth/v1/callback
     ```

4. Click **"Register application"**
5. You'll get:
   - **Client ID** (copy this)
   - **Client Secret** (click "Generate new client secret" and copy it)

### B. Configure in Supabase

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Find **GitHub** provider
3. Toggle it **ON**
4. Enter:
   - **Client ID** (from GitHub)
   - **Client Secret** (from GitHub)
5. Click **Save**

---

## ✅ Step 4: Verify Setup

### Test in Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Invite user"** or test GitHub login
3. After logging in with GitHub, check:
   - User appears in **Authentication** → **Users**
   - User automatically appears in **Table Editor** → **users** table with GitHub data populated

---

## 📦 Step 5: Install Supabase Package

In your terminal (in the project directory):

```bash
npm install @supabase/supabase-js
```

---

## 🔍 What the Trigger Does

When a user signs up via GitHub OAuth:

1. **Supabase Auth** creates user in `auth.users` table
2. **Trigger fires** automatically
3. **Extracts data** from GitHub OAuth response:
   - `id` - Supabase auth UUID
   - `email` - Email from GitHub
   - `name` - Full name from GitHub profile
   - `github` - GitHub username
4. **Inserts into** `public.users` table

---

## 🎨 Data Flow

```
User clicks "Log in" button
          ↓
GitHub OAuth popup opens
          ↓
User authorizes on GitHub
          ↓
Supabase creates user in auth.users
          ↓
Trigger automatically creates user in public.users
          ↓
Extension receives auth session
          ↓
User is logged in! 🎉
```

---

## 🚨 Common Issues

### Issue: Callback URL mismatch
- **Solution**: Make sure GitHub OAuth callback URL EXACTLY matches your Supabase project URL + `/auth/v1/callback`

### Issue: User not appearing in public.users
- **Solution**: Check if trigger was created correctly. Run this to verify:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: RLS blocking access
- **Solution**: Make sure policies are created and user is authenticated

---

## 📝 Notes

- The `SECURITY DEFINER` in the trigger function allows it to bypass RLS and insert into `public.users`
- The trigger uses `raw_user_meta_data` which contains all GitHub profile info
- GitHub username is stored in `raw_user_meta_data->>'user_name'` (note: underscore, not hyphen)
- Full name might be in either `name` or `full_name` field, so we use `COALESCE`

---

## ✨ Next Steps

After completing this setup:
1. ✅ Update `.env` with your Supabase credentials
2. ✅ Run SQL commands in Supabase SQL Editor
3. ✅ Set up GitHub OAuth app and configure in Supabase
4. ✅ Install npm package
5. ✅ Ready for authentication code!
