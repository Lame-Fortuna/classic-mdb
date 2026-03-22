/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono'
import { Movie } from './types'

type Bindings = {
  DB: D1Database,
  API_KEY: string;
}

const app = new Hono<{ Bindings: Bindings }>()
const LIMIT = 10;

function formatSearchResult(movie: Movie | undefined) {
  if (!movie) return null;
  return {
    tmdb_id: movie.tmdb_id,
    title: movie.title,
    year: movie.release_year,
    imdb_id: movie.imdb_id,
    genres: movie.genres || [],
    country: movie.production_countries?.map((c: any) => c.name) || [],
    language: movie.original_language,
    plot: movie.plot_summary ? movie.plot_summary.substring(0, 100) + '...' : '',
    poster: movie.images?.poster,
    poster2: movie.images?.poster2,
    directors: movie.credits?.directors?.map((d: any) => d.name) || [],
    actors: movie.credits?.actors?.slice(0, 3).map((a: any) => a.name) || [],
    imdb_rating: movie.ratings?.imdb_rating,
    imdb_votes: movie.ratings?.imdb_votes,
    metascore: movie.ratings?.metascore,
    audience_rating: movie.age_certification,
    runtime: movie.runtime,
    available: movie.source === null
  };
}

// Prevents SQL injection on sorting
function getSorting(sortBy: string | undefined, order: string | undefined) {
  const validColumns = ['release_year', 'popularity', 'rating'];
  const safeSort = validColumns.includes(sortBy || '') ? sortBy : 'release_year';
  const safeOrder = (order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  return `ORDER BY m.${safeSort} ${safeOrder}`; 
}

// Middleware for API key authentication
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('x-api-key');
  if (apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized. Please provide a valid x-api-key header.' }, 401);
  }
  await next();
});

// GET By ID
app.get('/api/movies/:id', async (c) => {
  const tmdbId = parseInt(c.req.param('id'), 10);
  const record = await c.env.DB.prepare(`SELECT raw_data FROM movies WHERE tmdb_id = ?`).bind(tmdbId).first<{ raw_data: string }>();
  
  if (!record) return c.json({ error: 'Movie not found' }, 404);
  return c.json(JSON.parse(record.raw_data));
});

// GET All Genres
app.get('/api/genres', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT DISTINCT value as genre 
    FROM movies, json_each(movies.genres)
    ORDER BY genre ASC
  `).all();
  
  return c.json(results.map(r => r.genre));
});

// GET By Genre
app.get('/api/genres/:genre', async (c) => {
  const genre = c.req.param('genre').toLowerCase(); // Forced lowercase based on your JSON
  const page = parseInt(c.req.query('page') || '1', 10);
  const offset = (page - 1) * LIMIT;
  const sorting = getSorting(c.req.query('sortBy'), c.req.query('order'));

  const query = `SELECT m.raw_data FROM movies m JOIN movies_fts f ON m.tmdb_id = f.tmdb_id WHERE f.genres MATCH ? ${sorting} LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) as total FROM movies_fts WHERE genres MATCH ?`;
  const searchTerm = `"${genre}"`;

  const [dataRes, countRes] = await c.env.DB.batch([
    c.env.DB.prepare(query).bind(searchTerm, LIMIT, offset),
    c.env.DB.prepare(countQuery).bind(searchTerm)
  ]);

  const rawMovies = dataRes.results.map((r: any) => JSON.parse(r.raw_data));

  return c.json({
    count: (countRes.results[0] as any).total,
    page: page,
    results: rawMovies.map(formatSearchResult)
  });
});

// GET Search by Term
app.get('/api/movie/search', async (c) => {
  const term = c.req.query('q') || ''; 
  const page = parseInt(c.req.query('page') || '1', 10);
  const offset = (page - 1) * LIMIT;
  const sorting = getSorting(c.req.query('sortBy'), c.req.query('order'));

  const query = `SELECT m.raw_data FROM movies m JOIN movies_fts f ON m.tmdb_id = f.tmdb_id WHERE movies_fts MATCH ? ${sorting} LIMIT ? OFFSET ?`;

  const countQuery = `SELECT COUNT(*) as total FROM movies_fts WHERE movies_fts MATCH ?`;
  const searchTerm = `"${term}"`;

  const [dataRes, countRes] = await c.env.DB.batch([
    c.env.DB.prepare(query).bind(searchTerm, LIMIT, offset), 
    c.env.DB.prepare(countQuery).bind(searchTerm)           
  ]);

  const rawMovies = dataRes.results.map((r: any) => JSON.parse(r.raw_data));

  return c.json({
    count: (countRes.results[0] as any).total,
    page: page,
    results: rawMovies.map(formatSearchResult)
  });
});

// GET By Crew
app.get('/api/movie/crew', async (c) => {
  const personId = c.req.query('id'); 
  const role = c.req.query('role'); 
  
  if (!personId || !role) {
    return c.json({ error: "Both 'id' and 'role' are required parameters." }, 400);
  }

  const page = parseInt(c.req.query('page') || '1', 10);
  const offset = (page - 1) * LIMIT;
  const sorting = getSorting(c.req.query('sortBy'), c.req.query('order'));

  const column = role === 'directors' ? 'director_ids' : 'cast_ids';
  const query = `SELECT m.raw_data FROM movies m JOIN movies_fts f ON m.tmdb_id = f.tmdb_id WHERE f.${column} MATCH ? ${sorting} LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) as total FROM movies_fts WHERE ${column} MATCH ?`;
  const searchId = `"${personId}"`;

  const [dataRes, countRes] = await c.env.DB.batch([
    c.env.DB.prepare(query).bind(searchId, LIMIT, offset),
    c.env.DB.prepare(countQuery).bind(searchId)
  ]);

  const rawMovies = dataRes.results.map((r: any) => JSON.parse(r.raw_data));

  return c.json({
    count: (countRes.results[0] as any).total,
    page: page,
    results: rawMovies.map(formatSearchResult)
  });
});

export default app;