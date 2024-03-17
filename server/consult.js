const sqlite3 = require('sqlite3').verbose();

const dbPath = './carousel_images.db'; // Ruta para la base de datos en disco

// Abre la conexión con la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log('Conexión exitosa a la base de datos');
    
    // Realiza la consulta para obtener todas las imágenes del carrusel
    db.all('SELECT * FROM carousel_images', (err, rows) => {
      if (err) {
        console.error('Error al consultar las imágenes del carrusel:', err.message);
        return;
      }
      
      if (rows.length > 0) {
        console.log('Se encontraron las siguientes imágenes en el carrusel:');
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Ruta de la imagen: ${row.image_path}`);
        });
      } else {
        console.log('No se encontraron imágenes en el carrusel.');
      }
    });
  }
});