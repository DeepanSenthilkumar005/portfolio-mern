/**
 * Portfolio contact form → Google Sheet + email notification.
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

// Where notification mail goes. Set to '' to turn notifications off.
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

    // The row is saved by this point, so a mail failure must not fail the
    // request — that would tell the sender it didn't go through when it did.
    if (NOTIFY_EMAIL) {
      try {
        notify_(name, email, msg);
      } catch (mailErr) {
        console.error('Notification email failed:', mailErr);
      }
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

/**
 * Sends yourself the message. replyTo is the sender's address, so hitting
 * Reply in Gmail answers them rather than yourself.
 *
 * This needs the MailApp scope, granted when you authorise the deployment.
 * Adding it to an already-deployed script means re-authorising once.
 */
function notify_(name, email, msg) {
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var html =
    '<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1c1917">' +
    '<p style="margin:0 0 4px"><strong>' + escape_(name) + '</strong></p>' +
    '<p style="margin:0 0 20px"><a href="mailto:' + encodeURI(email) + '">' + escape_(email) + '</a></p>' +
    '<div style="border-left:3px solid #c2571f;padding:2px 0 2px 14px;white-space:pre-wrap">' +
    escape_(msg) +
    '</div>' +
    '<p style="margin:24px 0 0;font-size:13px;color:#78716c">' +
    'Sent from your portfolio &middot; <a href="' + sheetUrl + '">open the sheet</a>' +
    '</p></div>';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Portfolio: ' + name,
    replyTo: email,
    name: 'Portfolio contact form',
    body: name + ' <' + email + '> wrote:\n\n' + msg + '\n\n' + sheetUrl,
    htmlBody: html,
  });
}

/** Sends a test message to NOTIFY_EMAIL. Run this from the editor to check mail works. */
function testNotification() {
  notify_('Test Sender', 'someone@example.com', 'If this lands in your inbox, notifications work.');
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

  // First write to a fresh sheet lays down the header row.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow(row);
}

function escape_(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
