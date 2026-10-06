process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
const jwt = require('jsonwebtoken');
const http = require('node:http');
const { createApp } = require('./geomine-backend-express/dist/server.js');
const { prisma } = require('./geomine-backend-express/dist/config.js');

prisma.profiles.findUnique = async () => ({
  id: '11111111-1111-1111-1111-111111111111',
  full_name: 'Admin User',
  role: 'admin',
});

prisma.machines.create = async ({ data }) => ({
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  ...data,
  status: 'active',
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  updated_at: new Date('2025-01-01T00:00:00.000Z'),
});

const app = createApp();
const server = app.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const token = jwt.sign(
    { sub: '11111111-1111-1111-1111-111111111111', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const payload = JSON.stringify({ name: 'Generator 7', location: 'North Plant', phaseType: 'three_phase' });
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/api/machines',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (d) => {
        body += d.toString();
      });
      res.on('end', () => {
        console.log('STATUS', res.statusCode);
        console.log('BODY', body);
        server.close(() => process.exit(0));
      });
    }
  );

  req.on('error', (err) => {
    console.error('ERR', err);
    server.close(() => process.exit(1));
  });

  req.write(payload);
  req.end();
});
