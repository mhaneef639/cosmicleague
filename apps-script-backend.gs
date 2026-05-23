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
//  • Appends each application as a row in a Google Sheet
//    (created automatically on first submission)
//  • Sends you an email notification for every new application
//
//  To view submissions:
//  Go to Google Drive and look for "Cosmic League – Applications"
// ================================================================

const NOTIFICATION_EMAIL = 'dr.haneefmo@gmail.com';
const SHEET_NAME          = 'Applications';

// ── POST handler — called by the website form ──────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
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
    data.fullName   || '',
    data.profession || '',
    data.email      || '',
    data.reason     || '',
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
