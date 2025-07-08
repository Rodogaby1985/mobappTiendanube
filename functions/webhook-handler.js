exports.handler = async function(event, context) {
  const topic = event.headers['x-webhook-topic'];
  const data = JSON.parse(event.body);

  console.log("Webhook recibido:", topic);
  console.log("Datos:", data);

  switch(topic) {
    case 'app/suspended':
      console.log("La app fue suspendida:", data.store_id);
      break;
    case 'app/resumed':
      console.log("La app fue reactivada:", data.store_id);
      break;
    case 'store/redact':
      console.log("Redactando datos de tienda:", data.store_id);
      break;
    case 'customers/redact':
      console.log("Redactando clientes:", data.customer_ids);
      break;
    case 'customer/data_request':
      console.log("Solicitud de datos de cliente:", data.customer_id);
      break;
    default:
      console.log("Evento no reconocido");
  }

  return {
    statusCode: 200,
    body: "OK"
  };
};
