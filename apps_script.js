// ============================================================
// Odors in the Wild — Google Apps Script Backend
// ============================================================
//
// SETUP INSTRUCTIONS (do this once):
//   1. Go to https://script.google.com → New Project
//   2. Paste the ENTIRE contents of this file, replacing any default code
//   3. Click Deploy → New Deployment
//        - Type: Web app
//        - Execute as: Me (pellegrino.robert@gmail.com)
//        - Who has access: Anyone
//   5. Copy the Web App URL → paste it into index.html as APPS_SCRIPT_URL
//
// After ANY code change: Deploy → Manage Deployments → Edit → New Version
// Test the endpoint by opening its URL in a browser — you should see {"status":"ok"}
// ============================================================

var SHEET_ID   = "1t0S-GiLV9HniELK2YUczmgaC8GKirdMDoLLwE1di91E";
var SHEET_NAME = "responses";

// Column order — must match the sheet header row created by setup_sheets.R
var ALL_COLUMNS = [
  "subject", "sample", "timestamp", "latitude", "longitude",
  "woody_pine", "woody_smokey", "woody_earthy", "woody_mushroom",
  "woody_waxy", "woody_musty", "woody_rubber", "woody_woody",
  "herbal_green", "herbal_cucumber", "herbal_mint", "herbal_herbal",
  "brown_spice_roasted", "brown_spice_burnt", "brown_spice_grainy", "brown_spice_brown_spice",
  "fruity_fruity", "fruity_citrus", "fruity_tropical", "fruity_berry",
  "fruity_peach", "fruity_cocunut",
  "floral_floral", "floral_powdery", "floral_sweet", "floral_carmellic", "floral_vanilla",
  "animal_animal", "animal_fishy", "animal_meaty", "animal_fatty",
  "animal_dairy", "animal_cheesy", "animal_buttery",
  "decay_decay", "decay_yeasty", "decay_fecal", "decay_sulfurous",
  "decay_alliaceous", "decay_alcoholic", "decay_fermented", "decay_sour",
  "medicinal_medicinal", "medicinal_phenolic", "medicinal_cooling",
  "medicinal_ozone", "medicinal_metallic", "medicinal_ammonia",
  "medicinal_sharp", "medicinal_chlorine", "medicinal_plastic"
];

// ── GET ──────────────────────────────────────────────────────
// ?action=results  → returns all response rows as JSON (for the Results tab)
// (no params)      → health check
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "status";

  if (action === "results") {
    try {
      var ss    = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName(SHEET_NAME);

      if (!sheet || sheet.getLastRow() < 2) {
        return jsonOut({ status: "ok", data: [] });
      }

      var values  = sheet.getDataRange().getValues();
      var headers = values[0];
      var rows    = [];

      for (var i = 1; i < values.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          row[String(headers[j])] = values[i][j];
        }
        rows.push(row);
      }

      return jsonOut({ status: "ok", data: rows });

    } catch (err) {
      return jsonOut({ status: "error", message: err.toString() });
    }
  }

  // Default: health check
  return jsonOut({ status: "ok", message: "Odors in the Wild endpoint is live." });
}

// ── POST ─────────────────────────────────────────────────────
// Receives a JSON submission from index.html and appends it to the Sheet
function doPost(e) {
  try {
    var data  = JSON.parse(e.postData.contents);
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers if missing
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(ALL_COLUMNS);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(ALL_COLUMNS);
    }

    // Read live headers so column order always matches the sheet
    var headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    var row = headers.map(function(h) {
      return (h in data) ? data[h] : "";
    });

    sheet.appendRow(row);

    return jsonOut({ status: "ok" });

  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() });
  }
}

// ── Helper ───────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
