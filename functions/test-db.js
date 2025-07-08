const { Pool } = require('pg');

exports.handler = async function(event, context) {
  const pool = new Pool({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    const res = await pool.query("SELECT NOW()");
    return {
      statusCode: 200,
      body: JSON.stringify({ now: res.rows[0].now })
    };
  } catch (err) {
    console.error("Error al conectar:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudo conectar a la base de datos" })
    };
  }
};
