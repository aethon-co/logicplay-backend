-- Create a table for Users (Custom implementation since we aren't using Supabase Auth API)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password text not null, -- Storing plain text as requested by architecture change, should be hashed in production
  school_name text not null,
  grade text not null,
  full_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for Games
create table public.games (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  grade_level text not null,
  game_url text,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Insert some dummy data
insert into public.games (title, description, grade_level, game_url, thumbnail_url)
values 
('Math Blaster', 'Fun math game for grade 5', '5', 'https://example.com/mathblaster', 'https://example.com/img1.jpg'),
('Science Explorer', 'Learn science for grade 5', '5', 'https://example.com/science', 'https://example.com/img2.jpg'),
('Spelling Bee', 'Spelling game for grade 3', '3', 'https://example.com/spelling', 'https://example.com/img3.jpg');
