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

    GET /api/genres
    Returns an array of all available genres.

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
