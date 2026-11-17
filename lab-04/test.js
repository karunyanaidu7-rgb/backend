const http = require('http');
const jwt = require('jsonwebtoken');
const { app, initializeDBAndServer, JWT_SECRET } = require('./server');

const TEST_PORT = 3030;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   Lab 4: Automated Verification & Test Suite');
  console.log('====================================================\n');

  let server;
  try {
    server = await initializeDBAndServer(TEST_PORT);
  } catch (err) {
    console.error('Failed to start test server:', err);
    process.exit(1);
  }

  const testUser = {
    username: 'alex_mercer',
    name: 'Alex Mercer',
    password: 'SuperSecretPassword123',
  };

  let passed = 0;
  let total = 0;

  function assert(condition, message, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  try {
    // Test 1: Register new user
    console.log('\n--- 1. Testing Registration ---');
    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/register/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      testUser
    );
    assert(
      regRes.statusCode === 200 || regRes.statusCode === 201,
      `POST /register/ returns 200/201 on new user registration (Status: ${regRes.statusCode})`,
      regRes.body
    );

    // Test 2: Register existing user (duplicate rejection)
    const dupRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/register/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      testUser
    );
    assert(
      dupRes.statusCode === 400 && dupRes.body.includes('User already exists'),
      `POST /register/ rejects existing username with status 400 (Status: ${dupRes.statusCode}, Body: "${dupRes.body}")`
    );

    // Test 3: Register invalid input (short password)
    const shortPassRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/register/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'short_user', name: 'Short', password: '123' }
    );
    assert(
      shortPassRes.statusCode === 400,
      `POST /register/ rejects short password (<5 chars) with status 400 (Status: ${shortPassRes.statusCode})`
    );

    // Test 4: Successful login
    console.log('\n--- 2. Testing Login & JWT Generation ---');
    const loginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/login/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: testUser.username, password: testUser.password }
    );

    assert(
      loginRes.statusCode === 200,
      `POST /login/ returns status 200 on valid credentials (Status: ${loginRes.statusCode})`
    );

    let parsedLogin = {};
    try {
      parsedLogin = JSON.parse(loginRes.body);
    } catch (e) {}

    assert(
      typeof parsedLogin.jwt_token === 'string' && parsedLogin.jwt_token.length > 0,
      `POST /login/ response contains 'jwt_token'`
    );

    // Test 5: Verify JWT Token Structure & Payload
    console.log('\n--- 3. Testing JWT Token Structure & jwt.io Decoding ---');
    if (parsedLogin.jwt_token) {
      const token = parsedLogin.jwt_token;
      const parts = token.split('.');
      assert(parts.length === 3, `JWT token has exactly 3 dot-separated parts (Header.Payload.Signature)`);

      const decodedHeader = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      console.log('Decoded Token Breakdown:');
      console.log('   Header:   ', JSON.stringify(decodedHeader));
      console.log('   Payload:  ', JSON.stringify(decodedPayload));
      console.log('   Signature: [Protected cryptographic signature]');

      assert(decodedHeader.alg === 'HS256', `Header specifies HS256 algorithm`);
      assert(decodedPayload.username === testUser.username, `Payload contains username: '${testUser.username}'`);
      assert(
        !decodedPayload.password && !decodedPayload.hash,
        `SECURITY CHECK: Password/hash is NOT in token payload (strictly username only)`
      );

      // Verify token signature with secret key
      try {
        const verified = jwt.verify(token, JWT_SECRET);
        assert(verified.username === testUser.username, `Signature verifies successfully with JWT_SECRET`);
      } catch (err) {
        assert(false, `JWT signature verification failed: ${err.message}`);
      }
    }

    // Test 6: Login with unknown user
    console.log('\n--- 4. Testing Login Error Handling ---');
    const unknownUserRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/login/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'non_existent_user_999', password: 'SomePassword' }
    );
    assert(
      unknownUserRes.statusCode === 400 && unknownUserRes.body.includes('Invalid user'),
      `POST /login/ returns 400 for unknown user (Status: ${unknownUserRes.statusCode}, Body: "${unknownUserRes.body}")`
    );

    // Test 7: Login with wrong password
    const wrongPassRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/login/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: testUser.username, password: 'IncorrectPassword' }
    );
    assert(
      wrongPassRes.statusCode === 400 && wrongPassRes.body.includes('Invalid password'),
      `POST /login/ returns 400 for wrong password (Status: ${wrongPassRes.statusCode}, Body: "${wrongPassRes.body}")`
    );

    // Test 8: Verify Database stores only hashes
    console.log('\n--- 5. Testing Database Security (Hashed Passwords) ---');
    const dbViewRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/users/',
      method: 'GET',
    });
    const users = JSON.parse(dbViewRes.body);
    const storedUser = users.find((u) => u.username === testUser.username);

    assert(Boolean(storedUser), `User record exists in SQLite database`);
    if (storedUser) {
      assert(
        storedUser.password !== testUser.password,
        `Password is NOT stored in plain text`
      );
      assert(
        storedUser.password.startsWith('$2b$') || storedUser.password.startsWith('$2a$'),
        `Password is stored as a valid bcrypt hash (${storedUser.password.substring(0, 15)}...)`
      );
    }

    console.log('\n====================================================');
    console.log(`Results: ${passed}/${total} checks passed.`);
    if (passed === total) {
      console.log('🎉 ALL LAB 4 SPECIFICATIONS VERIFIED AND MET!');
    } else {
      console.log('⚠️ Some checks failed. Please review the output above.');
    }
    console.log('====================================================\n');
  } catch (error) {
    console.error('Unexpected test error:', error);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();

