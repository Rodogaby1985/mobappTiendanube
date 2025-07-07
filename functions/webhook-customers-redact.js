exports.handler = async function(event, context) {
  const data = JSON.parse(event.body);
  console.log("Webhook Customer Redact recibido:", data);
  return {
    statusCode: 200,
    body: "OK"
  };
};