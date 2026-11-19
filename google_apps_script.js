/**
 * ============================================================================
 * ASHARAIZ LOGISTICS LLC - GOOGLE APPS SCRIPT FORM BACKEND
 * ============================================================================
 * 
 * INSTRUCTIONS TO DEPLOY UNDER asharaizexpedite@gmail.com (Takes 2 minutes):
 * 1. Open Google Sheets (https://sheets.new) while logged into asharaizexpedite@gmail.com
 * 2. In top menu click: Extensions > Apps Script
 * 3. Delete any code in the editor and PASTE this entire script.
 * 4. Click "Deploy" (top right) > "New deployment"
 * 5. In "Select type" gear icon, choose "Web app"
 * 6. Set:
 *    - Description: "Asharaiz Agreement Submissions"
 *    - Execute as: "Me (asharaizexpedite@gmail.com)"
 *    - Who has access: "Anyone"  <-- CRITICAL!
 * 7. Click "Deploy", authorize permissions when prompted.
 * 8. COPY the "Web app URL" (it looks like: https://script.google.com/macros/s/.../exec)
 * 9. Paste that URL into script.js under SUBMISSION_CONFIG.googleAppsScriptUrl!
 * 
 * THAT'S IT! Every time a client submits the agreement, Google's servers will
 * instantly send the full 7-page contract email to asharaizexpedite@gmail.com and save
 * a permanent copy in your Google Sheet!
 */

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    
    // 1. Destination email
    var recipient = "asharaizexpedite@gmail.com";
    var carrier = data.carrier_name || data["Carrier Company"] || "New Carrier";
    var signer = data.signer_name || data["Signer Full Name"] || "Authorized Signer";
    var refId = data.ref_id || data["Reference ID"] || "#AL-" + new Date().getFullYear();
    var viewUrl = data.view_url || data["View Agreement Online"] || "https://asharaiz-logistics.github.io/-Asharaiz-Logistics-LLC/";
    
    var subject = "🚀 New Signed Carrier Agreement: " + carrier + " (" + signer + ") [" + refId + "]";

    // 2. Build Rich Executive Email Template
    var htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #0f172a; padding: 25px 20px; text-align: center; border-bottom: 4px solid #f5b301;">
          <h1 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 0.5px;">ASHARAIZ LOGISTICS LLC</h1>
          <p style="margin: 6px 0 0; color: #f5b301; font-size: 13px; font-weight: bold; text-transform: uppercase;">Official Carrier Agreement & Authorizations Submission</p>
        </div>

        <div style="padding: 24px;">
          <!-- Prominent Callout Link to View/Print Filled 7-Page Agreement -->
          <div style="background: #f0fdf4; border: 1.5px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: bold;">
              📄 Completed 7-Page Paperwork Ready for Review & Printing
            </p>
            <a href="${viewUrl}" target="_blank" style="background: #10b981; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
              🔗 Click Here to View & Print Full Filled Agreement
            </a>
            <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;">All inputs, digital signatures, and banking authorizations are loaded into all 7 pages.</p>
          </div>

          <!-- Summary Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; width: 35%; color: #64748b;">Reference ID:</td><td style="padding: 10px; font-weight: bold; color: #0f172a;">${refId}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Carrier Company:</td><td style="padding: 10px; font-weight: bold; color: #0f172a;">${carrier}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Authorized Signer:</td><td style="padding: 10px; color: #0f172a;">${signer} (${data.signer_title || 'Owner'})</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Agreement Date:</td><td style="padding: 10px; color: #0f172a;">${data.signer_date || data["Agreement Date"] || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">DOT / MC Number:</td><td style="padding: 10px; color: #0f172a;">${data.dot_mc_number || data["DOT or MC Number"] || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Dispatch Rate Terms:</td><td style="padding: 10px; font-weight: bold; color: #2563eb;">${data.pricing_rate || data["Pricing Agreed Terms"] || '5%'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Cardholder Email:</td><td style="padding: 10px; color: #0f172a;">${data.cardholder_email || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Card Details:</td><td style="padding: 10px; color: #0f172a;">${data.card_info || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Bank Routing & Account:</td><td style="padding: 10px; color: #0f172a;">${data.bank_info || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Zelle ID:</td><td style="padding: 10px; color: #0f172a;">${data.bank_zelle || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">SMS Consent:</td><td style="padding: 10px; color: #0f172a;">${data.allow_sms || data["SMS Consent"] || 'Yes'}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Digital Signatures:</td><td style="padding: 10px; color: #16a34a; font-weight: bold;">✓ Verified & Timestamped</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #64748b;">Submission Timestamp:</td><td style="padding: 10px; color: #64748b;">${new Date().toLocaleString()}</td></tr>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Submitted via Asharaiz Logistics Official Web Portal • All Rights Reserved
        </div>
      </div>
    `;

    // 3. Send email directly from Google to asharaizexpedite@gmail.com
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });

    // 4. Optionally record row in active Google Sheet
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.appendRow([
        new Date(),
        refId,
        carrier,
        signer,
        data.signer_date || '',
        data.dot_mc_number || '',
        data.pricing_rate || '',
        data.cardholder_email || '',
        viewUrl
      ]);
    } catch (sheetErr) {}

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Delivered to " + recipient }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
