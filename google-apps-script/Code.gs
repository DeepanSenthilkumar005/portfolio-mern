/**
 * Portfolio contact form → Google Sheet.
 *
 * Deploy this as a Web App (see SETUP.md) and point the site's
 * VITE_FORM_ENDPOINT at the resulting /exec URL.
 *
 * The site posts JSON as text/plain on purpose: that keeps it a "simple"
 * CORS request, so the browser never sends a preflight OPTIONS, which
 * Apps Script web apps cannot answer.
 */

// Leave blank to write to the first sheet of the bound spreadsheet.
var SHEET_NAME = 'Messages';

// Set to '' to turn off email notifications.
var NOTIFY_EMAIL = 'workwithdeepan@gmail.com';

var HEADERS = ['Timestamp', 'Name', 'Email', 'Message', 'Source'];

function doPost(e) {
  try {
    var payload = parseBody_(e);

    // Honeypot: real people leave this hidden field empty.
    if (payload.website) {
      return json_({ ok: true });
    }

    var name = String(payload.name || '').trim();
    var email = String(payload.email || '').trim();
    var msg = String(payload.msg || payload.message || '').trim();

    if (!name || !email || !msg) {
      return json_({ ok: false, error: 'Name, email and message are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json_({ ok: false, error: 'That email address does not look right.' });
    }

    if (name.length > 100 || email.length > 150 || msg.length > 2000) {
      return json_({ ok: false, error: 'That message is too long.' });
    }

    appendRow_([new Date(), name, email, msg, payload.source || 'portfolio']);

    if (NOTIFY_EMAIL) {
      notify_(name, email, msg);
    }

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Could not save that. Try again?' });
  }
}

/** Lets you open the /exec URL in a browser to check the deploy is live. */
function doGet() {
  return json_({ ok: true, service: 'portfolio-contact' });
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return (e && e.parameter) || {};
}

function appendRow_(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // First write of a fresh sheet lays down the header row.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow(row);
}

function notify_(name, email, msg) {
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Portfolio message from ' + name,
    replyTo: email,
    body: name + ' <' + email + '> wrote:\n\n' + msg,
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
