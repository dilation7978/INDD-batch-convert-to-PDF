// Batch_INDD_to_PDF.jsx
// Batch-exports every .indd file in a chosen folder to PDF.
// PDFs are saved next to the source files. Documents are closed without saving.

#target indesign

(function () {
    // ---- Settings -------------------------------------------------------
    var PRESET_NAME = "[High Quality Print]"; // any PDF preset name from File > Adobe PDF Presets
    var OVERWRITE_EXISTING = true;            // false = skip files that already have a PDF
    // ---------------------------------------------------------------------

    var folder = Folder.selectDialog("Choose a folder of InDesign files to export to PDF");
    if (!folder) return;

    var files = folder.getFiles(function (f) {
        return (f instanceof File) &&
               /\.indd$/i.test(f.name) &&
               f.name.indexOf("._") !== 0; // skip macOS resource-fork files
    });

    if (files.length === 0) {
        alert("No .indd files found in:\n" + decodeURI(folder.fsName));
        return;
    }

    var preset = app.pdfExportPresets.itemByName(PRESET_NAME);
    if (!preset.isValid) {
        preset = app.pdfExportPresets[0];
        alert("Preset \"" + PRESET_NAME + "\" not found.\nUsing \"" + preset.name + "\" instead.");
    }

    var oldInteraction = app.scriptPreferences.userInteractionLevel;
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;

    var exported = 0, skipped = 0, errors = [];

    try {
        for (var i = 0; i < files.length; i++) {
            var src = files[i];
            var baseName = decodeURI(src.name).replace(/\.indd$/i, "");
            var pdfFile = new File(folder.fsName + "/" + baseName + ".pdf");

            if (!OVERWRITE_EXISTING && pdfFile.exists) {
                skipped++;
                continue;
            }

            var doc = null;
            try {
                doc = app.open(src, false); // open without a window
                app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
                doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false, preset);
                exported++;
            } catch (e) {
                errors.push(decodeURI(src.name) + ": " + e.message);
            } finally {
                if (doc && doc.isValid) {
                    doc.close(SaveOptions.NO);
                }
            }
        }
    } finally {
        app.scriptPreferences.userInteractionLevel = oldInteraction;
    }

    var msg = "Done.\n\nExported: " + exported + " of " + files.length;
    if (skipped) msg += "\nSkipped (PDF exists): " + skipped;
    if (errors.length) msg += "\n\nErrors (" + errors.length + "):\n" + errors.join("\n");
    alert(msg);
})();
