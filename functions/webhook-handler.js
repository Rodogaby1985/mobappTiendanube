exports.handler = async function(event, context) {
  const topic = event.headers['x-webhook-topic'];
  const data = JSON.parse(event.body);

  console.log("Webhook recibido:", topic);
  console.log("Datos:", data);

  // Manejo por tipo de evento
  switch(topic) {
    case 'app/suspended':
      console.log("La aplicación fue suspendida:", data.store_id);
      break;

    case 'app/resumed':
      console.log("La aplicación fue reanudada:", data.store_id);
      break;

    case 'store/redact':
      console.log("Se solicitó redactar datos de tienda:", data.store_id);
      break;

    case 'customers/redact':
      console.log("Se solicitó redactar clientes:", data.customer_ids);
      break;

    case 'customer/data_request':
      console.log("Cliente solicitó sus datos:", data.customer_id);
      break;

    default:
      console.log("Evento no reconocido:", topic);
  }

  return {
    statusCode: 200,
    body: "OK"
  };
};