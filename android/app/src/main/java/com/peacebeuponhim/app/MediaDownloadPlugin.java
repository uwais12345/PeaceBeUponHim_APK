package com.peacebeuponhim.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Native Media Download Plugin to save rendered poster PNGs
 * directly into Android's system Pictures/Gallery.
 */
@CapacitorPlugin(name = "MediaDownload")
public class MediaDownloadPlugin extends Plugin {

    @PluginMethod
    public void saveImage(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename", "peace-inspiration-" + System.currentTimeMillis() + ".png");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Base64 data is required");
            return;
        }

        // Strip data:image/...;base64, prefix if present
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        try {
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);

            // Android 10+ (API 29+): Scoped Storage via MediaStore into Pictures/PeaceBeUponHim
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "image/png");
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/PeaceBeUponHim");
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                if (imageUri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }

                try (OutputStream out = resolver.openOutputStream(imageUri)) {
                    if (out != null) {
                        out.write(imageBytes);
                        out.flush();
                    }
                }

                contentValues.clear();
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(imageUri, contentValues, null, null);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", imageUri.toString());
                call.resolve(ret);
            } else {
                // Android 9 and below
                File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File appDir = new File(picturesDir, "PeaceBeUponHim");
                if (!appDir.exists()) {
                    appDir.mkdirs();
                }
                File imageFile = new File(appDir, filename);
                try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                    fos.write(imageBytes);
                    fos.flush();
                }

                // Scan file to make it visible in Gallery
                android.media.MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{imageFile.getAbsolutePath()},
                    new String[]{"image/png"},
                    null
                );

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", imageFile.getAbsolutePath());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Failed to save image: " + e.getMessage(), e);
        }
    }
}
