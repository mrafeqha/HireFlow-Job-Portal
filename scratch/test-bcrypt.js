const bcrypt = require('bcryptjs');
const hash = '$2a$10$63vB8599z9Ld56Q8qZ.qeeN9.hO5.kOq7K9cQ65F6t8sS75aU8YV2';

console.log('Seeded Hash matches password123:', bcrypt.compareSync('password123', hash));

const freshHash = bcrypt.hashSync('password123', 10);
console.log('Freshly generated hash for password123:', freshHash);
