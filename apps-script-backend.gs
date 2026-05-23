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
//  • Appends each application as a row in the linked Google Sheet
//  • Sends you an email notification for every new application
//
//  To view submissions:
//  Open the Apps Script project → Extensions → Sheets (or go to
//  the Google Sheet that was automatically linked to this project)
// ================================================================

const NOTIFICATION_EMAIL = 'dr.haneefmo@gmail.com';
const SHEET_NAME          = 'Applications';

// ── POST handler — called by the website form ──────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    saveToSheet(data);
    sendEmailNotification(data);

    return respond({ success: true });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ── GET handler — health check ─────────────────────────────────
function doGet() {
  return respond({ status: 'Cosmic League backend is active.' });
}

// ── Save row to Google Sheet ───────────────────────────────────
function saveToSheet(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
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
}

// ── Email notification ─────────────────────────────────────────
function sendEmailNotification(data) {
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
    `View all applications in Google Sheets:\n` +
    `https://docs.google.com/spreadsheets/d/${SpreadsheetApp.getActiveSpreadsheet().getId()}`;

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
