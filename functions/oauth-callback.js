const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
});

exports.handler = async function(event, context) {
  const { code, store } = event.queryStringParameters;

  try {
    // Intercambiar código por token
    const response = await axios.post(`https://${store}.mitiendanube.com/admin/oauth/access_token`, {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code
    });

    const access_token = response.data.access_token;

    // Guardar token en base de datos
    await pool.query(
      'INSERT INTO stores(store_name, access_token) VALUES($1, $2) ON CONFLICT(store_name) DO UPDATE SET access_token = $2',
      [store, access_token]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, store, access_token })
    };

  } catch (error) {
    console.error("Error al obtener token:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Fallo en autenticación" })
    };
  }
};
