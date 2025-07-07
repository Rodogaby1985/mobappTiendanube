const axios = require('axios');

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

    // Guardar en base de datos (usaremos Neon más adelante)
    console.log(`Token obtenido para ${store}:`, access_token);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, store, access_token })
    };

  } catch (error) {
    console.error("Error al obtener token:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Fallo en autenticación" })
    };
  }
};