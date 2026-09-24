create table if not exists public.movies (
  id bigint generated always as identity primary key,
  title text not null,
  release_year integer not null,
  director text not null,
  genre text not null
);

alter table public.movies enable row level security;

grant select on public.movies to anon, authenticated;

drop policy if exists "Anyone can read movies" on public.movies;
create policy "Anyone can read movies"
  on public.movies
  for select
  to anon, authenticated
  using (true);

insert into public.movies (title, release_year, director, genre)
values
  ('The Godfather', 1972, 'Francis Ford Coppola', 'Crime'),
  ('The Shawshank Redemption', 1994, 'Frank Darabont', 'Drama'),
  ('The Dark Knight', 2008, 'Christopher Nolan', 'Action'),
  ('Pulp Fiction', 1994, 'Quentin Tarantino', 'Crime'),
  ('Schindler''s List', 1993, 'Steven Spielberg', 'Drama'),
  ('Spirited Away', 2001, 'Hayao Miyazaki', 'Animation'),
  ('Parasite', 2019, 'Bong Joon Ho', 'Thriller'),
  ('The Matrix', 1999, 'Lana Wachowski and Lilly Wachowski', 'Science fiction');
