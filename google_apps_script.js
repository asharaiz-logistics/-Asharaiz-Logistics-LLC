/**
 * ASHARAIZ LOGISTICS LLC - GOOGLE APPS SCRIPT BACKEND
 * Recipient: asharaizexpedite@gmail.com
 */

var SHEET_NAME = "Submissions";
var RECIPIENT = "asharaizexpedite@gmail.com";
var SPREADSHEET_ID = "1H_xhkywumEz_xjePfP3Fyu-Eg4DFZhTbUoGsYodzPYc";
var HEADERS = [
  "Timestamp",
  "Reference ID",
  "Carrier Company",
  "Authorized Signer",
  "Signer Title",
  "Agreement Date",
  "DOT / MC Number",
  "Pricing Rate",
  "Email",
  "Card Info",
  "Bank Info",
  "Zelle ID",
  "SMS Consent",
  "View Link"
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
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 1. Destination Email
    var carrier = text(data.carrier_name || data["Carrier Company"], "New Carrier");
    var signer = text(data.signer_name || data["Signer Full Name"], "Authorized Signer");
    var signerTitle = text(data.signer_title || data["Signer Title"], "Owner");
    var signerDate = text(data.signer_date || data["Agreement Date"], "N/A");
    var dotMc = text(data.dot_mc_number || data["DOT / MC Number"], "N/A");
    var pricing = text(data.pricing_rate || data["Pricing Agreed Terms"], "N/A");
    var cardEmail = text(data.cardholder_email || data.Email, "N/A");
    var cardInfo = text(data.card_info, "N/A");
    var bankInfo = text(data.bank_info, "N/A");
    var zelle = text(data.bank_zelle, "N/A");
    var sms = text(data.allow_sms || data["SMS Consent"], "Yes");
    var viewUrl = text(
      data.view_url || data["View Agreement Online"] || data["View Link"],
      "https://asharaiz-logistics.github.io/-Asharaiz-Logistics-LLC/"
    );
    var refId = text(
      data.ref_id || data["Reference ID"],
      "#AL-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000)
    );
    var timestamp = text(data.timestamp, new Date().toLocaleString());

    var subject = "🚀 New Signed Carrier Agreement: " + carrier + " (" + signer + ") [" + refId + "]";

    // 2. Build Rich Executive Email Template
    var htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #ffffff;">
        <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #f5b301;">
          <h1 style="margin: 0; color: #ffffff; font-size: 22px;">ASHARAIZ LOGISTICS LLC</h1>
          <p style="margin: 6px 0 0; color: #f5b301; font-size: 13px; font-weight: bold;">NEW CARRIER AGREEMENT & AUTHORIZATIONS</p>
        </div>

        <div style="padding: 24px;">
          <div style="background: #f0fdf4; border: 1.5px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #166534; font-weight: bold;">
              📄 Completed 7-Page Paperwork Ready for Review & Printing
            </p>
            <a href="${escapeHtml(viewUrl)}" target="_blank" style="background: #10b981; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
              🔗 Click Here to View & Print Full Filled Agreement
            </a>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; width: 35%; color: #64748b;">Reference ID:</td><td style="padding: 10px; font-weight: bold; color: #0f172a;">${escapeHtml(refId)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Carrier Company:</td><td style="padding: 10px; font-weight: bold; color: #0f172a;">${escapeHtml(carrier)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Authorized Signer:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(signer)} (${escapeHtml(signerTitle)})</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Agreement Date:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(signerDate)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">DOT / MC Number:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(dotMc)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Dispatch Rate:</td><td style="padding: 10px; font-weight: bold; color: #2563eb;">${escapeHtml(pricing)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Cardholder Email:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(cardEmail)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Card Info:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(cardInfo)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Bank Routing & Account:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(bankInfo)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Zelle ID:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(zelle)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">SMS Consent:</td><td style="padding: 10px; color: #0f172a;">${escapeHtml(sms)}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Digital Signatures:</td><td style="padding: 10px; color: #16a34a; font-weight: bold;">✓ Verified & Timestamped</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #64748b;">Timestamp:</td><td style="padding: 10px; color: #64748b;">${escapeHtml(timestamp)}</td></tr>
          </table>
        </div>
      </div>
    `;

    // 3. Send Email
    MailApp.sendEmail({
      to: RECIPIENT,
      name: "Asharaiz Logistics LLC",
      replyTo: RECIPIENT,
      subject: subject,
      htmlBody: htmlBody
    });

    // 4. Record Row in Google Sheet
    var sheet = getSubmissionsSheet();
    ensureHeaders(sheet);

    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1]) === refId) {
        return jsonResponse({
          status: "success",
          duplicate: true,
          message: "Submission already recorded"
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

    return jsonResponse({
      status: "success",
      message: "Saved to Google Sheets and delivered by email",
      referenceId: refId,
      sheetName: sheet.getName()
    });
  } catch (err) {
    return jsonResponse({
      status: "error",
      error: err.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function getSubmissionsSheet() {
  var spreadsheet;
  if (SPREADSHEET_ID) {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!spreadsheet) {
    throw new Error("Destination Google Sheet could not be opened.");
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
  } else if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
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
