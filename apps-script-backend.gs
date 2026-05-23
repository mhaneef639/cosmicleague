// ================================================================
//  COSMIC LEAGUE — Google Apps Script Backend
//  File: apps-script-backend.gs
// ================================================================
//
//  SETUP INSTRUCTIONS (one-time, ~5 minutes)
//  ------------------------------------------
//  1. Go to https://script.google.com  → New project
//  2. Name it "Cosmic League – Contact Form"
//  3. Delete all existing code, paste this entire file
//  4. Click the save icon (or Ctrl/Cmd + S)
//  5. Click "Deploy" (top right) → "New deployment"
//  6. Click the gear icon next to "Type" → select "Web app"
//  7. Set "Execute as"        → Me (your Google account)
//  8. Set "Who has access"    → Anyone
//  9. Click "Deploy" → authorise when prompted
// 10. Copy the Web App URL shown at the end
// 11. Open script.js and replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
//     with that URL — save, commit, deploy. Done.
//
//  WHAT THIS DOES
//  ---------------
//  • Receives form submissions via HTTP POST from the website
//  • Validates fields (required, length limits, email format)
//  • Rate limits to MAX_PER_MINUTE submissions per minute (global)
//  • Appends each application as a row in a Google Sheet
//    (created automatically on first submission)
//  • Sends you an email notification for every new application
//
//  To view submissions:
//  Go to Google Drive and look for "Cosmic League – Applications"
// ================================================================

const NOTIFICATION_EMAIL = 'dr.haneefmo@gmail.com';
const SHEET_NAME          = 'Applications';

// ── Field length limits (characters) ───────────────────────────
const MAX_LENGTHS = {
  fullName:   100,
  profession: 150,
  email:      254,   // RFC max email length
  reason:    5000,   // generous, but stops abuse
};

// ── Rate limit: max submissions per minute (global) ────────────
const MAX_PER_MINUTE = 5;

// ── POST handler — called by the website form ──────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. Validate input
    const validationError = validate(data);
    if (validationError) {
      return respond({ success: false, error: validationError });
    }

    // 2. Check rate limit
    if (!withinRateLimit()) {
      return respond({ success: false, error: 'Too many submissions. Please try again later.' });
    }

    // 3. Save and notify
    const ssId = saveToSheet(data);
    sendEmailNotification(data, ssId);
    return respond({ success: true });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── GET handler — health check ─────────────────────────────────
function doGet() {
  return respond({ status: 'Cosmic League backend is active.' });
}

// ── Validate submitted data ────────────────────────────────────
function validate(data) {
  // All fields required
  if (!data.fullName || !data.profession || !data.email || !data.reason) {
    return 'All fields are required.';
  }

  // Trim whitespace before checking length
  for (const field in MAX_LENGTHS) {
    const value = String(data[field] || '').trim();
    if (value.length === 0) return `Field "${field}" cannot be empty.`;
    if (value.length > MAX_LENGTHS[field]) {
      return `Field "${field}" exceeds maximum length of ${MAX_LENGTHS[field]} characters.`;
    }
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(data.email).trim())) {
    return 'Invalid email address.';
  }

  return null;
}

// ── Rate limit using CacheService ──────────────────────────────
function withinRateLimit() {
  const cache = CacheService.getScriptCache();
  const key   = 'submission_count';
  const count = parseInt(cache.get(key) || '0', 10);

  if (count >= MAX_PER_MINUTE) return false;

  // Cache entry expires after 60 seconds
  cache.put(key, String(count + 1), 60);
  return true;
}

// ── Get or create the spreadsheet ─────────────────────────────
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const ssId  = props.getProperty('SHEET_ID');

  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // Sheet was deleted — fall through and create a new one
    }
  }

  const ss = SpreadsheetApp.create('Cosmic League – Applications');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

// ── Save row to Google Sheet ───────────────────────────────────
function saveToSheet(data) {
  const ss    = getSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [['Timestamp', 'Full Name', 'Profession / Role', 'Email', 'Reason for Coaching']];
    sheet.getRange(1, 1, 1, 5).setValues(headers).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    String(data.fullName).trim(),
    String(data.profession).trim(),
    String(data.email).trim(),
    String(data.reason).trim(),
  ]);

  return ss.getId();
}

// ── Email notification ─────────────────────────────────────────
function sendEmailNotification(data, ssId) {
  const timestamp = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Riyadh',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const subject = `New Coaching Application — ${data.fullName || 'Unknown'}`;

  const body =
    `A new coaching application has been submitted on cosmicleague.net.\n\n` +
    `────────────────────────────────\n` +
    `Full Name:   ${data.fullName   || '—'}\n` +
    `Profession:  ${data.profession || '—'}\n` +
    `Email:       ${data.email      || '—'}\n` +
    `────────────────────────────────\n\n` +
    `Why they are seeking coaching:\n\n${data.reason || '—'}\n\n` +
    `────────────────────────────────\n` +
    `Submitted: ${timestamp}\n\n` +
    `View all applications:\n` +
    `https://docs.google.com/spreadsheets/d/${ssId}`;

  MailApp.sendEmail({
    to:      NOTIFICATION_EMAIL,
    subject: subject,
    body:    body,
  });
}

// ── JSON response helper ───────────────────────────────────────
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
