exports.handler = async function(event, context) {
  const data = JSON.parse(event.body);
  console.log("Webhook Customer Data Request recibido:", data);
  return {
    statusCode: 200,
    body: "OK"
  };
};