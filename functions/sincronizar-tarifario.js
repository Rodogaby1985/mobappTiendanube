// functions/sincronizar-tarifario.js

const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
});

// === LEER CODIGOS POSTALES DESDE GOOGLE SHEETS ===
async function leerCodigosPostales() {
  const SHEET_ID = process.env.SHEET_ID; // Tu ID de Google Sheet
  const SHEET_NAME = "CODIGOS POSTALES"; // Pestaña con CPs
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/ ${SHEET_ID}/values/${SHEET_NAME}?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const rows = response.data.values.slice(1); // Ignorar encabezado

    const codigosPorProvincia = {};
    rows.forEach(row => {
      const provincia = row[2]; // Columna C: Provincia
      const cp = row[1].toString(); // Columna B: Código Postal

      if (!codigosPorProvincia[provincia]) {
        codigosPorProvincia[provincia] = [];
      }

      codigosPorProvincia[provincia].push(cp);
    });

    return codigosPorProvincia;

  } catch (e) {
    console.error("Error al leer códigos postales:", e.message);
    return {};
  }
}

// === LEER TARIFARIOS LOGÍSTICOS ===
async function leerTarifariosDesdeSheet(servicio) {
  const SHEET_ID = process.env.SHEET_ID;
  const SHEET_NAME = servicio; // Ej: ANDREANI SUC → se usa como nombre de pestaña
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/ ${SHEET_ID}/values/${SHEET_NAME}?key=${apiKey}`;

  try {
    const sheetRes = await axios.get(url);
    const rows = sheetRes.data.values.slice(1); // Ignorar encabezado
    const headers = sheetRes.data.values[0];

    const data = rows.map(row => {
      return row.reduce((obj, val, i) => {
        obj[headers[i]] = val;
        return obj;
      }, {});
    });

    // Agrupar por provincia
    const agrupadoPorProvincia = {};
    data.forEach(row => {
      const provincia = row.PROVINCIA;
      if (!agrupadoPorProvincia[provincia]) agrupadoPorProvincia[provincia] = [];
      agrupadoPorProvincia[provincia].push({
        weight: parseFloat(row["PESO MAX"]),
        price: parseFloat(row.PRECIO)
      });
    });

    return agrupadoPorProvincia;

  } catch (e) {
    console.error(`❌ Error al leer ${servicio}:`, e.message);
    return {};
  }
}

// === CREAR MÉTODOS DE ENVÍO EN TIENDANUBE ===
async function crearMetodoEnTiendaNube(storeName, access_token, servicioNombre, provincia, rates, postalCodes) {
  const url = `https://api.tiendanube.com/2025-03/ ${storeName}/shipping_methods`;

  const payload = {
    shipping_method: {
      name: `${servicioNombre} - ${provincia}`,
      description: "Método de envío automatizado",
      enabled: true,
      price_based: false,
      weight_based: true,
      shipping_method_weights: rates,
      shipping_method_zones: [{
        country: "AR",
        postal_codes: postalCodes
      }]
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Authentication": `bearer ${access_token}`,
        "User-Agent": "MiAppLogistica (contacto@dominio.com)",
        "Content-Type": "application/json"
      }
    });

    console.log(`✅ Método creado: ${servicioNombre} - ${provincia}`);
  } catch (e) {
    console.error(`❌ Error creando método para ${provincia}:`, e.response?.data || e.message);
  }
}

// === MANEJADOR PRINCIPAL ===
exports.handler = async function(event, context) {
  const storeName = event.queryStringParameters.store || 'frankielenceriamayorista2';

  // Leer token desde PostgreSQL
  const res = await pool.query('SELECT * FROM stores WHERE store_name = $1', [storeName]);
  const store = res.rows[0];

  if (!store) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Tienda no encontrada" })
    };
  }

  // Leer códigos postales
  const codigosPostales = await leerCodigosPostales();

  // Lista de servicios logísticos que queremos sincronizar
  const serviciosLogisticos = [
    "ANDREANI SUC",
    "ANDREANI DOM",
    "ANDREANI BIGGER A DOM",
    "CA SUC",
    "CA DOM",
    "OCA SUC",
    "OCA DOM",
    "URBANO"
  ];

  // Leer cada servicio logístico
  for (const servicio of serviciosLogisticos) {
    const tarifasPorProvincia = await leerTarifariosDesdeSheet(servicio);

    for (const provincia in tarifasPorProvincia) {
      const rates = tarifasPorProvincia[provincia];
      const postalCodes = codigosPostales[provincia] || [];

      await crearMetodoEnTiendaNube(storeName, store.access_token, servicio, provincia, rates, postalCodes);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "✅ Todos los métodos de envío fueron actualizados" })
  };
};
