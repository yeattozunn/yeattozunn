/**
 * Google Apps Script template bound to each customer's product sheet.
 *
 * Setup per customer:
 *   1. Copy this script into the sheet's Extensions > Apps Script editor.
 *   2. Set the two script properties below (File > Project properties >
 *      Script properties), or edit the constants directly:
 *        WEBHOOK_URL     - the backend's public /api/upload-trigger URL
 *        WEBHOOK_TOKEN   - this sheet's unique customer_sheets.webhook_token
 *   3. Reload the sheet; a "IdeaSoft Yükleme" menu appears with "Şimdi Yükle".
 */

var STATUS_COLUMN_HEADER = 'Durum';
var SUMMARY_ROW = 1; // row where the run summary banner is written

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IdeaSoft Yükleme')
    .addItem('Şimdi Yükle', 'triggerUpload')
    .addToUi();
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('WEBHOOK_URL');
  var webhookToken = props.getProperty('WEBHOOK_TOKEN');
  if (!webhookUrl || !webhookToken) {
    throw new Error('WEBHOOK_URL / WEBHOOK_TOKEN script properties are not set.');
  }
  return { webhookUrl: webhookUrl, webhookToken: webhookToken };
}

function triggerUpload() {
  var ui = SpreadsheetApp.getUi();
  var sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  var config = getConfig_();

  var payload = {
    sheet_id: sheetId,
    webhook_token: config.webhookToken,
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(config.webhookUrl, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 202) {
    ui.alert('Yükleme kuyruğa alındı. İşlem bitince "Durum" sütunu ve üstteki özet güncellenecek.');
  } else if (code === 402) {
    ui.alert('Abonelik aktif değil. Lütfen ödeme/onay durumunuzu kontrol edin.');
  } else if (code === 403) {
    ui.alert('Yetkilendirme hatası: sheet_id/webhook_token eşleşmedi. Lütfen destek ile iletişime geçin.');
  } else {
    ui.alert('Beklenmeyen hata (' + code + '): ' + body);
  }
}

/**
 * Called by the backend worker (via the same Sheets API access it already
 * has) is NOT how status gets written back — the worker writes directly
 * through the Sheets API using its own service-account credentials. This
 * function is kept only as a manual/debug helper for writing the summary
 * banner from within the sheet itself, and is not required for the normal
 * flow.
 */
function writeSummaryBanner_(sheet, processedCount) {
  var now = new Date();
  sheet.getRange(SUMMARY_ROW, 1).setValue(
    'Son işlem: ' + now.toLocaleString() + ' — ' + processedCount + ' ürün işlendi.',
  );
}
