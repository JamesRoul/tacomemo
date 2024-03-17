const express = require('express');
const app = express();

// Middleware para parsear JSON. Esto es útil si tu API va a recibir JSON en las peticiones.
app.use(express.json());

// Ruta de prueba para asegurarse de que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('El servidor está funcionando correctamente.');
});

// Configura el servidor para que escuche en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});