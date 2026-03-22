export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WhereToWatchRegion {
  link: string;
  flatrate?: WatchProvider[];
  ads?: WatchProvider[];
  buy?: WatchProvider[];
  rent?: WatchProvider[];
}

export interface Director {
  id: number;
  name: string;
}

export interface Writer {
  id: number;
  name: string;
  job: string;
}

export interface Actor {
  id: number;
  name: string;
  character: string;
  profile_image: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Credits {
  directors: Director[];
  writers: Writer[];
  actors: Actor[];
  crew: CrewMember[];
}

export interface Ratings {
  tmdb_rating: number;
  tmdb_votes: number;
  imdb_rating: string;
  imdb_votes: string;
  metascore: number | string | null;
  rotten_tomatoes: number | string | null;
}

export interface Images {
  poster: string | null;
  poster_original: string | null;
  poster2: string | null;
  backdrop_original: string | null;
  backdrop: string | null;
}

export interface Movie {
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  original_title: string;
  original_language: string;
  release_date: string; // YYYY-MM-DD
  release_year: number;
  runtime: number;
  status: string;
  age_certification: string | null;
  tagline: string;
  plot_summary: string;
  genres: string[];
  keywords: string[];
  alternative_titles: string[]; // Or an object array if TMDB alt titles are structured
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  ratings: Ratings;
  box_office: string;
  images: Images;
  videos: {
    youtube_trailer_keys: string[];
  };
  where_to_watch: Record<string, WhereToWatchRegion>;
  credits: Credits;
  budget: number;
  revenue: number;
  source: string | null;
  collection: any | null; // Define further if you have the shape of collection
  restricted: boolean;
}