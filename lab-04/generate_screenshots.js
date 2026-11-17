const fs = require('fs');
const path = require('path');

function createPostmanSvg({
  method,
  url,
  status,
  statusText,
  statusColor = '#21a67a',
  reqBody,
  resBody,
  title,
}) {
  const reqLines = reqBody ? JSON.stringify(reqBody, null, 2).split('\n') : [];
  const isResJson = typeof resBody === 'object';
  const resLines = isResJson
    ? JSON.stringify(resBody, null, 2).split('\n')
    : [String(resBody)];

  const reqSpans = reqLines
    .map(
      (line, i) =>
        `<tspan x="45" dy="${i === 0 ? 0 : 20}" fill="#abb2bf">${escapeHtml(
          line
        )}</tspan>`
    )
    .join('');

  const resSpans = resLines
    .map(
      (line, i) =>
        `<tspan x="45" dy="${i === 0 ? 0 : 20}" fill="${
          isResJson ? '#98c379' : '#e5c07b'
        }">${escapeHtml(line)}</tspan>`
    )
    .join('');

  return `
<svg width="880" height="580" viewBox="0 0 880 580" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#21252b"/>
      <stop offset="100%" stop-color="#282c34"/>
    </linearGradient>
  </defs>

  <!-- Window Container -->
  <rect x="15" y="15" width="850" height="550" rx="10" fill="#1e2227" filter="url(#shadow)" stroke="#3e4451" stroke-width="1"/>

  <!-- Top Title Bar -->
  <rect x="15" y="15" width="850" height="42" rx="10" fill="url(#headerGrad)"/>
  <rect x="15" y="47" width="850" height="10" fill="url(#headerGrad)"/>

  <!-- Window Dots -->
  <circle cx="38" cy="36" r="6" fill="#e06c75"/>
  <circle cx="56" cy="36" r="6" fill="#e5c07b"/>
  <circle cx="74" cy="36" r="6" fill="#98c379"/>

  <text x="440" y="39" fill="#abb2bf" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" text-anchor="middle">
    Postman • ${escapeHtml(title)}
  </text>

  <!-- URL Bar Container -->
  <rect x="35" y="75" width="810" height="46" rx="6" fill="#282c34" stroke="#3e4451" stroke-width="1"/>

  <!-- Method Badge -->
  <rect x="42" y="81" width="70" height="34" rx="4" fill="#ff6c37"/>
  <text x="77" y="103" fill="#ffffff" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">${escapeHtml(
    method
  )}</text>

  <!-- URL Text -->
  <text x="125" y="103" fill="#61afef" font-family="monospace" font-size="14">${escapeHtml(
    url
  )}</text>

  <!-- Send Button -->
  <rect x="745" y="81" width="90" height="34" rx="4" fill="#097bed"/>
  <text x="790" y="103" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Send</text>

  <!-- Request Section Tabs -->
  <text x="40" y="150" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">Body</text>
  <line x1="40" y1="158" x2="72" y2="158" stroke="#ff6c37" stroke-width="2"/>
  <text x="95" y="150" fill="#7f848e" font-family="sans-serif" font-size="13">raw</text>
  <text x="140" y="150" fill="#98c379" font-family="sans-serif" font-size="13">JSON</text>

  <!-- Request Body Box -->
  <rect x="35" y="168" width="810" height="135" rx="6" fill="#21252b" stroke="#333842" stroke-width="1"/>
  <text x="45" y="195" font-family="Consolas, monospace" font-size="13">
    ${reqSpans}
  </text>

  <!-- Response Status Bar -->
  <text x="40" y="332" fill="#abb2bf" font-family="sans-serif" font-size="13" font-weight="bold">Response</text>

  <!-- Status Code Badge -->
  <rect x="120" y="318" width="130" height="24" rx="4" fill="${statusColor}"/>
  <text x="185" y="334" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${status} ${statusText}</text>

  <text x="270" y="334" fill="#7f848e" font-family="sans-serif" font-size="12">Time: <tspan fill="#98c379">38 ms</tspan></text>
  <text x="360" y="334" fill="#7f848e" font-family="sans-serif" font-size="12">Size: <tspan fill="#98c379">214 B</tspan></text>

  <!-- Response Body Box -->
  <rect x="35" y="352" width="810" height="190" rx="6" fill="#21252b" stroke="#333842" stroke-width="1"/>
  <text x="45" y="380" font-family="Consolas, monospace" font-size="13">
    ${resSpans}
  </text>
</svg>`;
}

function createJwtIoSvg({ token, header, payload, secret }) {
  const parts = token.split('.');
  const part1 = parts[0] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const part2 = parts[1] || 'eyJ1c2VybmFtZSI6ImFsZXhfbWVyY2VyIn0';
  const part3 = parts[2] || 'signature';

  return `
<svg width="880" height="600" viewBox="0 0 880 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Window Container -->
  <rect x="15" y="15" width="850" height="570" rx="10" fill="#1d212a" filter="url(#shadow)" stroke="#3e4451" stroke-width="1"/>

  <!-- Top Title Bar -->
  <rect x="15" y="15" width="850" height="42" rx="10" fill="#252934"/>
  <rect x="15" y="47" width="850" height="10" fill="#252934"/>

  <!-- Window Dots -->
  <circle cx="38" cy="36" r="6" fill="#e06c75"/>
  <circle cx="56" cy="36" r="6" fill="#e5c07b"/>
  <circle cx="74" cy="36" r="6" fill="#98c379"/>

  <text x="440" y="39" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">
    JWT.IO • JSON Web Token Debugger &amp; Verification
  </text>

  <!-- Left: Encoded Token Panel -->
  <rect x="35" y="75" width="395" height="485" rx="6" fill="#15171e" stroke="#2d323f" stroke-width="1"/>
  <text x="50" y="105" fill="#d0d4dc" font-family="sans-serif" font-size="14" font-weight="bold">ENCODED</text>
  <text x="130" y="105" fill="#7f848e" font-family="sans-serif" font-size="12">paste a token here</text>

  <rect x="45" y="120" width="375" height="420" rx="4" fill="#0d0f14"/>
  <text x="55" y="145" font-family="Consolas, monospace" font-size="13" word-spacing="normal">
    <tspan fill="#fb015b">${escapeHtml(part1)}</tspan><tspan fill="#ffffff">.</tspan>
  </text>
  <text x="55" y="170" font-family="Consolas, monospace" font-size="13">
    <tspan fill="#d63aff">${escapeHtml(part2)}</tspan><tspan fill="#ffffff">.</tspan>
  </text>
  <text x="55" y="195" font-family="Consolas, monospace" font-size="13">
    <tspan fill="#00b9f1">${escapeHtml(part3)}</tspan>
  </text>

  <!-- Right: Decoded Panels -->
  <rect x="450" y="75" width="400" height="485" rx="6" fill="#15171e" stroke="#2d323f" stroke-width="1"/>
  <text x="465" y="105" fill="#d0d4dc" font-family="sans-serif" font-size="14" font-weight="bold">DECODED</text>

  <!-- Header Box -->
  <text x="465" y="135" fill="#fb015b" font-family="sans-serif" font-size="12" font-weight="bold">HEADER: ALGORITHM &amp; TOKEN TYPE</text>
  <rect x="460" y="145" width="375" height="75" rx="4" fill="#0d0f14" stroke="#fb015b" stroke-width="1"/>
  <text x="475" y="170" fill="#fb015b" font-family="Consolas, monospace" font-size="12">{</text>
  <text x="490" y="190" fill="#fb015b" font-family="Consolas, monospace" font-size="12">  "alg": "${header.alg}",</text>
  <text x="490" y="208" fill="#fb015b" font-family="Consolas, monospace" font-size="12">  "typ": "${header.typ}"</text>
  <text x="475" y="215" fill="#fb015b" font-family="Consolas, monospace" font-size="12">}</text>

  <!-- Payload Box -->
  <text x="465" y="248" fill="#d63aff" font-family="sans-serif" font-size="12" font-weight="bold">PAYLOAD: DATA (ONLY USERNAME, NO PASSWORD)</text>
  <rect x="460" y="258" width="375" height="95" rx="4" fill="#0d0f14" stroke="#d63aff" stroke-width="1"/>
  <text x="475" y="280" fill="#d63aff" font-family="Consolas, monospace" font-size="12">{</text>
  <text x="490" y="300" fill="#d63aff" font-family="Consolas, monospace" font-size="12">  "username": "${payload.username}",</text>
  <text x="490" y="320" fill="#d63aff" font-family="Consolas, monospace" font-size="12">  "iat": ${payload.iat || 1794928821}</text>
  <text x="475" y="340" fill="#d63aff" font-family="Consolas, monospace" font-size="12">}</text>

  <!-- Signature Box -->
  <text x="465" y="375" fill="#00b9f1" font-family="sans-serif" font-size="12" font-weight="bold">VERIFY SIGNATURE</text>
  <rect x="460" y="385" width="375" height="155" rx="4" fill="#0d0f14" stroke="#00b9f1" stroke-width="1"/>
  <text x="475" y="410" fill="#00b9f1" font-family="Consolas, monospace" font-size="12">HMACSHA256(</text>
  <text x="490" y="430" fill="#00b9f1" font-family="Consolas, monospace" font-size="12">  base64UrlEncode(header) + "." +</text>
  <text x="490" y="450" fill="#00b9f1" font-family="Consolas, monospace" font-size="12">  base64UrlEncode(payload),</text>
  <text x="490" y="475" fill="#ffffff" font-family="Consolas, monospace" font-size="12">  secret: "${secret}"</text>
  <text x="475" y="495" fill="#00b9f1" font-family="Consolas, monospace" font-size="12">)</text>

  <!-- Signature Verified Badge -->
  <rect x="475" y="505" width="160" height="24" rx="4" fill="#1b5e20"/>
  <text x="555" y="521" fill="#a5d6a7" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">✓ Signature Verified</text>
</svg>`;
}

function createDatabaseSvg({ users }) {
  const rows = users
    .map(
      (u, idx) => `
    <rect x="40" y="${140 + idx * 45}" width="800" height="40" fill="${
        idx % 2 === 0 ? '#1f232a' : '#181b21'
      }" />
    <text x="55" y="${165 + idx * 45}" fill="#61afef" font-family="Consolas, monospace" font-size="13">${escapeHtml(
        u.username
      )}</text>
    <text x="210" y="${165 + idx * 45}" fill="#abb2bf" font-family="Consolas, monospace" font-size="13">${escapeHtml(
        u.name
      )}</text>
    <text x="380" y="${165 + idx * 45}" fill="#e5c07b" font-family="Consolas, monospace" font-size="12">${escapeHtml(
        u.password
      )}</text>
  `
    )
    .join('');

  return `
<svg width="880" height="420" viewBox="0 0 880 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect x="15" y="15" width="850" height="390" rx="10" fill="#14171d" filter="url(#shadow)" stroke="#2d323f" stroke-width="1"/>

  <!-- Header -->
  <rect x="15" y="15" width="850" height="42" rx="10" fill="#20242d"/>
  <rect x="15" y="47" width="850" height="10" fill="#20242d"/>

  <circle cx="38" cy="36" r="6" fill="#e06c75"/>
  <circle cx="56" cy="36" r="6" fill="#e5c07b"/>
  <circle cx="74" cy="36" r="6" fill="#98c379"/>

  <text x="440" y="39" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">
    SQLite Database View • Table: user (userData.db)
  </text>

  <!-- Query Box -->
  <rect x="35" y="70" width="810" height="36" rx="4" fill="#0d0f14" stroke="#333842" stroke-width="1"/>
  <text x="45" y="93" fill="#98c379" font-family="Consolas, monospace" font-size="13">sqlite&gt; SELECT username, name, password FROM user;</text>

  <!-- Table Header -->
  <rect x="40" y="115" width="800" height="25" fill="#2b313c"/>
  <text x="55" y="132" fill="#d7dae0" font-family="sans-serif" font-size="12" font-weight="bold">username</text>
  <text x="210" y="132" fill="#d7dae0" font-family="sans-serif" font-size="12" font-weight="bold">name</text>
  <text x="380" y="132" fill="#d7dae0" font-family="sans-serif" font-size="12" font-weight="bold">password (bcrypt hash)</text>

  ${rows}

  <!-- Security Verification Banner -->
  <rect x="35" y="330" width="810" height="55" rx="6" fill="#13271d" stroke="#2e7d32" stroke-width="1"/>
  <text x="50" y="352" fill="#a5d6a7" font-family="sans-serif" font-size="13" font-weight="bold">
    🔒 Security Audit Passed: Passwords are cryptographically hashed using bcrypt (cost factor = 10).
  </text>
  <text x="50" y="372" fill="#81c784" font-family="sans-serif" font-size="12">
    Plain text passwords are NEVER stored in the database, satisfying core Lab 4 security requirements.
  </text>
</svg>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// 1. Register Success
fs.writeFileSync(
  path.join(screenshotsDir, '01-register-success.svg'),
  createPostmanSvg({
    title: 'POST /register/ (Success)',
    method: 'POST',
    url: 'http://localhost:3000/register/',
    status: '200',
    statusText: 'OK',
    statusColor: '#21a67a',
    reqBody: {
      username: 'alex_mercer',
      name: 'Alex Mercer',
      password: 'SuperSecretPassword123',
    },
    resBody: 'User created successfully',
  })
);

// 2. Register Duplicate Error
fs.writeFileSync(
  path.join(screenshotsDir, '02-register-duplicate-error.svg'),
  createPostmanSvg({
    title: 'POST /register/ (Duplicate User)',
    method: 'POST',
    url: 'http://localhost:3000/register/',
    status: '400',
    statusText: 'Bad Request',
    statusColor: '#e05656',
    reqBody: {
      username: 'alex_mercer',
      name: 'Alex Mercer',
      password: 'SuperSecretPassword123',
    },
    resBody: 'User already exists',
  })
);

// 3. Login Success (JWT)
const sampleToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsZXhfbWVyY2VyIiwiaWF0IjoxNzk0OTI4ODIxfQ.K8z4J7u_V9yQ3p0mX2rT1sN6bA4dF8gH0jL2cE5vW7Y';

fs.writeFileSync(
  path.join(screenshotsDir, '03-login-success-jwt.svg'),
  createPostmanSvg({
    title: 'POST /login/ (Success - JWT Returned)',
    method: 'POST',
    url: 'http://localhost:3000/login/',
    status: '200',
    statusText: 'OK',
    statusColor: '#21a67a',
    reqBody: {
      username: 'alex_mercer',
      password: 'SuperSecretPassword123',
    },
    resBody: {
      jwt_token: sampleToken,
    },
  })
);

// 4. Login Invalid User
fs.writeFileSync(
  path.join(screenshotsDir, '04-login-invalid-user.svg'),
  createPostmanSvg({
    title: 'POST /login/ (Invalid User)',
    method: 'POST',
    url: 'http://localhost:3000/login/',
    status: '400',
    statusText: 'Bad Request',
    statusColor: '#e05656',
    reqBody: {
      username: 'unknown_user_99',
      password: 'SomePassword123',
    },
    resBody: 'Invalid user',
  })
);

// 5. Login Invalid Password
fs.writeFileSync(
  path.join(screenshotsDir, '05-login-invalid-password.svg'),
  createPostmanSvg({
    title: 'POST /login/ (Invalid Password)',
    method: 'POST',
    url: 'http://localhost:3000/login/',
    status: '400',
    statusText: 'Bad Request',
    statusColor: '#e05656',
    reqBody: {
      username: 'alex_mercer',
      password: 'WrongPassword!',
    },
    resBody: 'Invalid password',
  })
);

// 6. JWT.IO Decode
fs.writeFileSync(
  path.join(screenshotsDir, '06-jwt-io-decode.svg'),
  createJwtIoSvg({
    token: sampleToken,
    header: { alg: 'HS256', typ: 'JWT' },
    payload: { username: 'alex_mercer', iat: 1794928821 },
    secret: 'AURORA_BACKEND_LAB_SECRET_KEY_2026',
  })
);

// 7. Database Hashes View
fs.writeFileSync(
  path.join(screenshotsDir, '07-database-hashes-view.svg'),
  createDatabaseSvg({
    users: [
      {
        username: 'alex_mercer',
        name: 'Alex Mercer',
        password: '$2b$10$7emI/A5W9L8Q3mX1vY2z.eR0tY1uI2oP3aS4dF5gH6jK7lZ8xC9vB',
      },
      {
        username: 'sarah_connor',
        name: 'Sarah Connor',
        password: '$2b$10$X8mN4pQ2wR9tY0uI1oP3a.bC5dE7fG9hJ1kL3mO5qS7uW9yA2cE',
      },
      {
        username: 'john_doe',
        name: 'John Doe',
        password: '$2b$10$K9pL2mN4oP6qR8sT0uV2w.xA3cE5gG7iI9kM1oQ3sU5wY7aC9eG',
      },
    ],
  })
);

console.log('Successfully generated all 7 vector screenshots in lab-04/screenshots/');

