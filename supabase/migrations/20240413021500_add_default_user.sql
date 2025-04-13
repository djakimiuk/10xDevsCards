-- Insert default user into auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '68daf106-0e17-4c83-809e-f4cb1ba4972e',  -- id (matching DEFAULT_USER_ID)
    'default@example.com',                     -- email
    '',                                        -- encrypted_password (empty for now)
    NOW(),                                     -- email_confirmed_at
    NOW(),                                     -- created_at
    NOW(),                                     -- updated_at
    '{"provider":"email","providers":["email"]}',  -- raw_app_meta_data
    '{}',                                          -- raw_user_meta_data
    false,                                         -- is_super_admin
    'authenticated'                                -- role
)
ON CONFLICT (id) DO NOTHING; 