import fs from 'fs';

// 1. Load your JSON file (check path carefully!)
const rawData = JSON.parse(fs.readFileSync('./scripts/vintage_movies_final.json', 'utf-8'));

// 2. Helper to escape single quotes for SQL
const escapeSql = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// 3. Setup the table structure
const sqlLines = [
  // Safely drop existing tables
  `DROP TABLE IF EXISTS movies_fts;`,
  `DROP TABLE IF EXISTS movies;`,

  // Create Base Table (No director_ids or cast_ids here!)
  `CREATE TABLE movies (
    tmdb_id INTEGER PRIMARY KEY,
    title TEXT,
    release_year INTEGER,
    genres TEXT,
    keywords TEXT,
    popularity REAL,
    rating REAL,
    raw_data TEXT
  );`,

  // Create Standard Indexes for blazing fast sorting
  `CREATE INDEX idx_movies_popularity ON movies(popularity DESC);`,
  `CREATE INDEX idx_movies_rating ON movies(rating DESC);`,
  `CREATE INDEX idx_movies_release_year ON movies(release_year DESC);`,

  // Create FTS5 Virtual Table for text search (Includes director/cast IDs!)
  `CREATE VIRTUAL TABLE movies_fts USING fts5(
    tmdb_id UNINDEXED,
    title,
    genres,
    keywords,
    director_ids,
    cast_ids
  );`
];

// 4. Loop through movies and generate INSERT statements
for (const movie of rawData) {
  // Calculate stats
  const tmdbRating = movie.ratings?.tmdb_rating || 0;
  const imdbRating = movie.ratings?.imdb_rating ? parseFloat(movie.ratings.imdb_rating) : 0;
  const rating = (tmdbRating + imdbRating) / 2;

  const tmdbVotes = movie.ratings?.tmdb_votes || 0;
  const imdbVotes = movie.ratings?.imdb_votes ? parseInt(movie.ratings.imdb_votes.replace(/,/g, ''), 10) : 0;
  const popularity = tmdbVotes + imdbVotes;

  // Stringify JSON for the base table
  const genresJson = JSON.stringify(movie.genres || []);
  const keywordsJson = JSON.stringify(movie.keywords || []);
  const raw = JSON.stringify(movie);

  // Extract pure text/IDs for the search table
  const genreText = (movie.genres || []).join(' ');
  const keywordText = (movie.keywords || []).join(' ');
  const directorText = (movie.credits?.directors?.map(d => String(d.id)) || []).join(' ');
  const castText = (movie.credits?.actors?.map(a => String(a.id)) || []).join(' ');

  // Insert into Base Table (8 variables)
  sqlLines.push(`INSERT INTO movies (tmdb_id, title, release_year, genres, keywords, popularity, rating, raw_data) VALUES (
    ${movie.tmdb_id},
    ${escapeSql(movie.title)},
    ${movie.release_year || 'NULL'},
    ${escapeSql(genresJson)},
    ${escapeSql(keywordsJson)},
    ${popularity},
    ${rating},
    ${escapeSql(raw)}
  );`);

  // Insert into FTS5 Table (6 variables)
  sqlLines.push(`INSERT INTO movies_fts (tmdb_id, title, genres, keywords, director_ids, cast_ids) VALUES (
    ${movie.tmdb_id},
    ${escapeSql(movie.title)},
    ${escapeSql(genreText)},
    ${escapeSql(keywordText)},
    ${escapeSql(directorText)},
    ${escapeSql(castText)}
  );`);
}

// 5. Write to a .sql file
fs.writeFileSync('seed.sql', sqlLines.join('\n'));
console.log(`Generated seed.sql with ${rawData.length} movies! Includes FTS5 and sorting indexes.`);