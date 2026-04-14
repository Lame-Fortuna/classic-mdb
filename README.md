# Classic Movies API

A REST API for querying a vintage movies database. Built with Hono, backed by SQLite with Full-Text Search (FTS), and deployed on Cloudflare Workers (via D1).

## Features
- Full-text search for titles and keywords using SQLite FTS.
- Exact match filtering by genre and crew ID.
- Pagination and dynamic sorting by release year, rating, or popularity.

## Setup and Local Development

1. Install dependencies:
```bash
npm install
```

2. Generate the database seed file:

```bash
node scripts/seed.js
```

3. Apply the schema and seed data to your remote Cloudflare D1 database:

```bash
npx wrangler d1 execute vintage-movies-db --remote --file=./seed.sql
```

4. Deploy the worker to Cloudflare:

```bash
npm run deploy
```

## API Endpoints
Movies

    GET /api/movies/:id
    Returns a specific movie by its TMDB ID.

Genres

    GET /api/genres/:genre
    Returns movies matching the exact genre.

Search

    GET /api/movie/search?q={term}
    Performs an FTS search across movie titles and keywords.

    GET /api/movie/crew?id={id}&role={role}
    Returns movies associated with a specific crew member.
    Required parameters: id (TMDB person ID) and role (cast or directors).

Global Query Parameters

The genre, search, and crew endpoints support the following optional query parameters:

    page: Integer. Specifies the pagination offset (default: 1). Results are strictly limited to 10 per page.

    sortBy: String. The property to sort results by (release_year, rating, or popularity).

    order: String. The sort direction (ASC or DESC. Default: DESC).

---
The shape of Movie

```
interface MovieRecord {
  tmdb_id: number;
  imdb_id: string;
  title: string;
  original_title: string;
  original_language: string;
  release_date: string; // YYYY-MM-DD
  year: number;
  runtime: number;
  status: string;
  age_certification: string | null;
  tagline: string;
  plot_summary: string;
  genres: string[];
  keywords: string[];
  alternative_titles: string[];
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  spoken_languages: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
  ratings: {
    tmdb_rating: number;
    tmdb_votes: number;
    imdb_rating: string;
    imdb_votes: string;
    metascore: number | string | null;
  };
  box_office: string;
  images: {
    poster: string;
    poster_original: string;
    poster2: string;
    backdrop_original: string;
    backdrop: string;
  };
  videos: {
    youtube_trailer_keys: string[];
  };
  where_to_watch: Record<string, string[]>; // e.g., { "US": ["Darkroom"] }
  credits: {
    directors: Array<{
      id: number;
      name: string;
    }>;
    writers: Array<{
      id: number;
      name: string;
      job: string;
    }>;
    actors: Array<{
      id: number;
      name: string;
      character: string;
      profile_image: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  budget: number;
  revenue: number;
  source: string[] | null;
  collection: any | null; 
  restricted: boolean;
}
```
---
The shape of Movie Search Result

```
interface PaginatedMovieResponse {
  count: number;
  page: number;
  results: MovieSummary[];
}

interface MovieSummary {
  tmdb_id: number;
  title: string;
  year: number;
  imdb_id: string;
  genres: string[];
  country: string[];
  language: string;
  tagline: string;
  poster: string;
  poster2: string;
  directors: string[];
  actors: string[];
  imdb_rating: string;
  imdb_votes: string;
  metascore: string;
  audience_rating: string;
  runtime: number;
  available: boolean;
}
```
