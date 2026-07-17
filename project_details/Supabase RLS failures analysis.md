# Supabase RLS failures analysis

## Extracted migrations / functions

### supabase/migrations/017_account_sharing.sql

```sql
-- ============================================================
-- MEMBERSHIP HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION is_account_member(
  target_account_id UUID,
  min_role account_role_enum DEFAULT 'viewer'
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.account_id = target_account_id
      AND CASE p.account_role
            WHEN 'owner'  THEN 4
            WHEN 'admin'  THEN 3
            WHEN 'agent'  THEN 2
            WHEN 'viewer' THEN 1
          END
        >=
          CASE min_role
            WHEN 'owner'  THEN 4
            WHEN 'admin'  THEN 3
            WHEN 'agent'  THEN 2
            WHEN 'viewer' THEN 1
          END
  );
$$;

ALTER FUNCTION is_account_member(UUID, account_role_enum) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_account_member(UUID, account_role_enum) TO authenticated, service_role;
```

### supabase/migrations/018_account_member_rpcs.sql

```sql
-- ============================================================
-- remove_account_member(p_user_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.remove_account_member(
  p_user_id UUID
) RETURNS UUID  -- the new personal account id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_account_id UUID;
  v_caller_role account_role_enum;
  v_target_account_id UUID;
  v_target_role account_role_enum;
  v_target_name TEXT;
  v_target_email TEXT;
  v_new_account_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT account_id, account_role
  INTO v_caller_account_id, v_caller_role
  FROM profiles
  WHERE user_id = auth.uid();

  IF v_caller_account_id IS NULL THEN
    RAISE EXCEPTION 'Caller has no account' USING ERRCODE = '42501';
  END IF;

  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'This action requires the admin role or higher'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself; transfer ownership or leave the account instead'
      USING ERRCODE = '22023';
  END IF;

  SELECT account_id, account_role, full_name, email
  INTO v_target_account_id, v_target_role, v_target_name, v_target_email
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_target_account_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = '22023';
  END IF;

  IF v_target_account_id <> v_caller_account_id THEN
    RAISE EXCEPTION 'Target user is not a member of your account'
      USING ERRCODE = '42501';
  END IF;

  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the account owner; transfer ownership first'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO accounts (name, owner_user_id)
  VALUES (
    COALESCE(NULLIF(v_target_name, ''), v_target_email, 'My account'),
    p_user_id
  )
  RETURNING id INTO v_new_account_id;

  UPDATE profiles
  SET account_id = v_new_account_id,
      account_role = 'owner'
  WHERE user_id = p_user_id;

  RETURN v_new_account_id;
END;
$$;

ALTER FUNCTION public.remove_account_member(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.remove_account_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_account_member(UUID) TO authenticated;
```

## Extracted RLS policies

### contacts

```sql
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;
CREATE POLICY contacts_select ON contacts FOR SELECT USING (is_account_member(account_id));
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (is_account_member(account_id, 'agent'));
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (is_account_member(account_id, 'agent'));
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (is_account_member(account_id, 'agent'));
```

### pipelines

```sql
DROP POLICY IF EXISTS "Users can manage own pipelines" ON pipelines;
CREATE POLICY pipelines_select ON pipelines FOR SELECT USING (is_account_member(account_id));
CREATE POLICY pipelines_insert ON pipelines FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));
CREATE POLICY pipelines_update ON pipelines FOR UPDATE USING (is_account_member(account_id, 'admin'));
CREATE POLICY pipelines_delete ON pipelines FOR DELETE USING (is_account_member(account_id, 'admin'));
```

### profiles

```sql
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (auth.uid() = user_id OR is_account_member(account_id));

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### accounts

```sql
DROP POLICY IF EXISTS accounts_select ON accounts;
DROP POLICY IF EXISTS accounts_update ON accounts;

CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (is_account_member(id));

CREATE POLICY accounts_update ON accounts FOR UPDATE
  USING (is_account_member(id, 'admin'))
  WITH CHECK (is_account_member(id, 'admin'));
```

## Missing due to tool limitation

Repo-wide search for every occurrence of `is_account_member(`, all inserts that create contacts/pipelines/flows/profiles/accounts, contact creation logic, and `seedDefaultPipeline` could not be completed because `search_files` failed with:

- `Could not find ripgrep binary`

Therefore those sections are not present here.

