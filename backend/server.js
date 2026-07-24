const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  HireFlow Server successfully started!`);
  console.log(`  Access URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
