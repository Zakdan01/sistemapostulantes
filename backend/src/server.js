require('dotenv').config();
const app = require('./app');

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`postulantes-v2 P1 en http://localhost:${PORT}`));
