export type Movie = {
  id: number;
  title: string;
  release_year: number;
  director: string;
  genre: string;
};

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  favorite_movie: string | null;
  created_at: string;
  updated_at: string;
};
