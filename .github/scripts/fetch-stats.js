#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DONOR_ID = '757631240';
const API_URL = `https://api2.foldingathome.org/uid/${DONOR_ID}`;
const ROOT = path.resolve(__dirname, '..', '..');

// Theme colors (matching the existing dark UI)
const COLORS = {
  bg: '#0f172a',
  bgLight: '#1e293b',
  accent: '#1d4ed8',
  accentLight: '#3b82f6',
  text: '#e5e7eb',
  textDim: '#94a3b8',
  border: '#334155',
};

function formatCompact(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function percentile(rank, total) {
  return ((rank / total) * 100).toFixed(1);
}

// Approximate text width for SVG (sans-serif at given font size)
function textWidth(str, fontSize) {
  return Math.round(str.length * fontSize * 0.6);
}

function generateBadge(data) {
  const label = 'Folding@home';
  const score = formatCompact(data.donor.score) + ' pts';
  const rank = '#' + formatNumber(data.donor.rank);

  const fontSize = 11;
  const pad = 8;
  const gap = 1;
  const h = 20;
  const r = 3;

  const w1 = textWidth(label, fontSize) + pad * 2;
  const w2 = textWidth(score, fontSize) + pad * 2;
  const w3 = textWidth(rank, fontSize) + pad * 2;
  const totalW = w1 + gap + w2 + gap + w3;

  const x2 = w1 + gap;
  const x3 = w1 + gap + w2 + gap;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" role="img" aria-label="${label}: ${score} | ${rank}">
  <title>${label}: ${score} | ${rank}</title>
  <rect width="${totalW}" height="${h}" rx="${r}" fill="${COLORS.bg}"/>
  <rect x="0" width="${w1}" height="${h}" rx="${r}" fill="${COLORS.accent}"/>
  <rect x="${w1}" width="${gap}" height="${h}" fill="${COLORS.bg}"/>
  <rect x="${x2}" width="${w2}" height="${h}" fill="${COLORS.bgLight}"/>
  <rect x="${x2 + w2}" width="${gap}" height="${h}" fill="${COLORS.bg}"/>
  <rect x="${x3}" width="${w3}" height="${h}" rx="${r}" fill="${COLORS.bgLight}"/>
  <rect x="${x2}" width="${r}" height="${h}" fill="${COLORS.bgLight}"/>
  <rect x="${x3}" width="${r}" height="${h}" fill="${COLORS.bgLight}"/>
  <g fill="${COLORS.text}" font-family="system-ui,sans-serif" font-size="${fontSize}" text-anchor="middle">
    <text x="${w1 / 2}" y="${h / 2 + 4}" font-weight="600">${label}</text>
    <text x="${x2 + w2 / 2}" y="${h / 2 + 4}">${score}</text>
    <text x="${x3 + w3 / 2}" y="${h / 2 + 4}">${rank}</text>
  </g>
</svg>`;
}

function generateCard(data) {
  const w = 400;
  const h = 180;
  const pad = 20;
  const name = data.donor.name;
  const donorId = 'Donor ID: ' + data.donor.id;
  const score = formatNumber(data.donor.score);
  const wus = formatNumber(data.donor.wus);
  const rank = '#' + formatNumber(data.donor.rank);
  const pct = percentile(data.donor.rank, data.donor.users);
  const team = data.team ? data.team.name : '';
  const updated = new Date(data.updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="Folding@home stats for ${name}">
  <title>Folding@home stats for ${name}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.accent}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${COLORS.bg}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="16" fill="${COLORS.bg}"/>
  <rect width="${w}" height="${h}" rx="16" fill="url(#bg)"/>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="none" stroke="${COLORS.border}" stroke-width="1"/>

  <g font-family="system-ui,-apple-system,sans-serif">
    <!-- Header -->
    <text x="${pad}" y="${pad + 14}" fill="${COLORS.textDim}" font-size="10" letter-spacing="1.5" text-transform="uppercase">FOLDING@HOME</text>
    <text x="${pad}" y="${pad + 34}" fill="${COLORS.text}" font-size="16" font-weight="600">${escapeXml(name)}</text>
    <text x="${pad}" y="${pad + 50}" fill="${COLORS.textDim}" font-size="10" font-family="ui-monospace,monospace">${donorId}</text>

    <!-- Stats row -->
    <text x="${pad}" y="${pad + 78}" fill="${COLORS.textDim}" font-size="10">SCORE</text>
    <text x="${pad}" y="${pad + 94}" fill="${COLORS.text}" font-size="14" font-weight="600">${score}</text>

    <text x="${pad + 130}" y="${pad + 78}" fill="${COLORS.textDim}" font-size="10">WORK UNITS</text>
    <text x="${pad + 130}" y="${pad + 94}" fill="${COLORS.text}" font-size="14" font-weight="600">${wus}</text>

    <text x="${pad + 260}" y="${pad + 78}" fill="${COLORS.textDim}" font-size="10">RANK</text>
    <text x="${pad + 260}" y="${pad + 94}" fill="${COLORS.text}" font-size="14" font-weight="600">${rank}</text>
    <text x="${pad + 260 + textWidth(rank, 14) + 6}" y="${pad + 94}" fill="${COLORS.textDim}" font-size="10">top ${pct}%</text>

    <!-- Footer -->
    <text x="${pad}" y="${h - pad + 4}" fill="${COLORS.textDim}" font-size="10">${team ? 'Team: ' + escapeXml(team) + '  ·  ' : ''}Updated ${updated}</text>
  </g>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  console.log('Fetching FAH stats...');
  const resp = await fetch(API_URL);
  if (!resp.ok) {
    throw new Error(`API returned ${resp.status}: ${resp.statusText}`);
  }
  const raw = await resp.json();

  const teamData = raw.teams && raw.teams[0] ? {
    id: raw.teams[0].team,
    name: raw.teams[0].name,
    score: raw.teams[0].tscore,
    rank: raw.teams[0].trank,
  } : null;

  const data = {
    donor: {
      name: raw.name,
      id: raw.id,
      score: raw.score,
      wus: raw.wus,
      rank: raw.rank,
      users: raw.users,
    },
    team: teamData,
    updated_at: new Date().toISOString(),
  };

  // Write stats.json
  const jsonPath = path.join(ROOT, 'stats.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
  console.log('Wrote', jsonPath);

  // Write badge.svg
  const badgePath = path.join(ROOT, 'badge.svg');
  fs.writeFileSync(badgePath, generateBadge(data));
  console.log('Wrote', badgePath);

  // Write card.svg
  const cardPath = path.join(ROOT, 'card.svg');
  fs.writeFileSync(cardPath, generateCard(data));
  console.log('Wrote', cardPath);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
