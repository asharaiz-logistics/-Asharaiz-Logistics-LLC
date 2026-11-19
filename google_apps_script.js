/*
 * Asharaiz Logistics LLC - Google Sheets submission backend
 *
 * Deploy instructions:
 * 1. Open the destination Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete the editor contents and paste this entire file.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me.
 * 6. Who has access: Anyone.
 * 7. After deployment, copy the /exec URL into script.js.
 */

var SHEET_NAME = "Submissions";
var RECIPIENT_EMAIL = "asharaizexpedite@gmail.com";
var HEADERS = [
  "Timestamp",
  "Reference ID",
  "Carrier Company",
  "Authorized Signer",
  "Signer Title",
  "Agreement Date",
  "DOT / MC Number",
  "Pricing Rate",
  "Cardholder Email",
  "Card Info",
  "Bank Info",
  "Zelle ID",
  "SMS Consent",
  "View / Print Agreement Link"
];

function doGet() {
  return jsonResponse({
    status: "ok",
    message: "Asharaiz Logistics submission endpoint is active"
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (_) {
        data = e.parameter || {};
      }
    } else {
      data = (e && e.parameter) || {};
    }

    var carrier = text(data.carrier_name || data["Carrier Company"], "New Carrier");
    var signer = text(data.signer_name || data["Signer Full Name"], "Authorized Signer");
    var signerTitle = text(data.signer_title || data["Signer Title"], "Owner");
    var signerDate = text(data.signer_date || data["Agreement Date"], "");
    var dotMc = text(data.dot_mc_number || data["DOT or MC Number"], "");
    var pricing = text(data.pricing_rate || data["Pricing Agreed Terms"], "");
    var cardEmail = text(data.cardholder_email || data.Email, "");
    var cardInfo = text(data.card_info, "");
    var bankInfo = text(data.bank_info, "");
    var zelle = text(data.bank_zelle, "");
    var sms = text(data.allow_sms || data["SMS Consent"], "No");
    var viewUrl = text(data.view_url || data["View / Print Agreement Link"],
      "https://asharaiz-logistics.github.io/-Asharaiz-Logistics-LLC/");
    var refId = text(data.ref_id || data["Reference ID"],
      "#AL-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000));
    var timestamp = text(data.timestamp, new Date().toLocaleString());

    var sheet = getSubmissionsSheet();
    ensureHeaders(sheet);

    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1]) === refId) {
        return jsonResponse({
          status: "success",
          duplicate: true,
          message: "Submission already recorded",
          referenceId: refId
        });
      }
    }

    sheet.appendRow([
      timestamp,
      refId,
      carrier,
      signer,
      signerTitle,
      signerDate,
      dotMc,
      pricing,
      cardEmail,
      cardInfo,
      bankInfo,
      zelle,
      sms,
      viewUrl
    ]);
    SpreadsheetApp.flush();

    var subject = "New Signed Carrier Agreement: " + carrier + " (" + signer + ") [" + refId + "]";
    var htmlBody =
      "<div style='font-family:Arial,sans-serif;max-width:680px'>" +
      "<h2>Asharaiz Logistics LLC - New Agreement Submission</h2>" +
      "<p><b>Reference ID:</b> " + escapeHtml(refId) + "</p>" +
      "<p><b>Carrier:</b> " + escapeHtml(carrier) + "</p>" +
      "<p><b>Signer:</b> " + escapeHtml(signer) + " (" + escapeHtml(signerTitle) + ")</p>" +
      "<p><b>Agreement Date:</b> " + escapeHtml(signerDate) + "</p>" +
      "<p><b>DOT / MC:</b> " + escapeHtml(dotMc) + "</p>" +
      "<p><b>Pricing:</b> " + escapeHtml(pricing) + "</p>" +
      "<p><b>Cardholder Email:</b> " + escapeHtml(cardEmail) + "</p>" +
      "<p><b>Card Info:</b> " + escapeHtml(cardInfo) + "</p>" +
      "<p><b>Bank Info:</b> " + escapeHtml(bankInfo) + "</p>" +
      "<p><b>Zelle:</b> " + escapeHtml(zelle) + "</p>" +
      "<p><b>SMS Consent:</b> " + escapeHtml(sms) + "</p>" +
      "<p><b>Submitted:</b> " + escapeHtml(timestamp) + "</p>" +
      "<p><a href='" + escapeHtml(viewUrl) + "'>View / Print Completed Agreement</a></p>" +
      "</div>";

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      htmlBody: htmlBody
    });

    return jsonResponse({
      status: "success",
      message: "Saved to Google Sheets and delivered by email",
      referenceId: refId,
      sheetName: sheet.getName()
    });
  } catch (error) {
    return jsonResponse({
      status: "error",
      error: error && error.toString ? error.toString() : String(error)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function getSubmissionsSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("This script is not bound to a Google Sheet. Open your Sheet, then Extensions > Apps Script.");
  }

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, Math.max(HEADERS.length, sheet.getLastColumn())).getValues()[0];
    var missing = false;
    for (var i = 0; i < HEADERS.length; i++) {
      if (firstRow[i] !== HEADERS[i]) {
        missing = true;
        break;
      }
    }
    if (missing) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#f1f5f9");
}

function text(value, fallback) {
  if (value === undefined || value === null) return fallback;
  var result = String(value).trim();
  return result ? result : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
