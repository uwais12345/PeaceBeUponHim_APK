package com.peacebeuponhim.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * Native Qiraath Audio Download Plugin.
 * Downloads full-surah MP3 files natively into app-private internal storage,
 * streams bytes directly to disk with zero JavaScript memory overhead,
 * and notifies the web view of real-time download progress.
 */
@CapacitorPlugin(name = "QiraathDownload")
public class QiraathDownloadPlugin extends Plugin {

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final Map<String, Future<?>> activeTasks = new ConcurrentHashMap<>();
    private final Map<String, Boolean> cancelFlags = new ConcurrentHashMap<>();

    private File getAudioDirectory() {
        File dir = new File(getContext().getFilesDir(), "qiraath_audio");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    @PluginMethod
    public void downloadSurahAudio(PluginCall call) {
        String urlString = call.getString("url");
        String filename = call.getString("filename");
        String key = call.getString("key");

        if (urlString == null || urlString.isEmpty() || filename == null || filename.isEmpty()) {
            call.reject("URL and filename are required");
            return;
        }

        final String downloadKey = (key != null && !key.isEmpty()) ? key : filename;

        // Prevent duplicate simultaneous downloads of the exact same track
        if (activeTasks.containsKey(downloadKey)) {
            call.reject("Download already in progress for this track");
            return;
        }

        File targetDir = getAudioDirectory();
        File finalFile = new File(targetDir, filename);

        // If file already exists and is non-empty, return immediately
        if (finalFile.exists() && finalFile.length() > 0) {
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("filePath", finalFile.getAbsolutePath());
            res.put("fileSize", finalFile.length());
            res.put("alreadyExists", true);
            call.resolve(res);
            return;
        }

        cancelFlags.put(downloadKey, false);

        Future<?> task = executor.submit(() -> {
            File tempFile = new File(targetDir, filename + ".tmp");
            HttpURLConnection connection = null;
            InputStream in = null;
            FileOutputStream out = null;

            try {
                URL url = new URL(urlString);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "PeaceBeUponHim-Android/1.0");
                connection.connect();

                int responseCode = connection.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK && responseCode != HttpURLConnection.HTTP_PARTIAL) {
                    throw new Exception("HTTP error code: " + responseCode);
                }

                long totalBytes = connection.getContentLengthLong();
                in = connection.getInputStream();
                out = new FileOutputStream(tempFile);

                byte[] buffer = new byte[16384]; // 16KB chunk
                long totalRead = 0;
                int bytesRead;
                long lastEmitTime = 0;

                while ((bytesRead = in.read(buffer)) != -1) {
                    if (Boolean.TRUE.equals(cancelFlags.get(downloadKey))) {
                        // Cancelled by user
                        throw new InterruptedException("Download cancelled by user");
                    }

                    out.write(buffer, 0, bytesRead);
                    totalRead += bytesRead;

                    long now = System.currentTimeMillis();
                    if (now - lastEmitTime > 250) { // Throttle progress emissions to every 250ms
                        lastEmitTime = now;
                        int progress = (totalBytes > 0) ? (int) ((totalRead * 100) / totalBytes) : 0;

                        JSObject progressData = new JSObject();
                        progressData.put("key", downloadKey);
                        progressData.put("progress", progress);
                        progressData.put("bytesDownloaded", totalRead);
                        progressData.put("totalBytes", totalBytes);
                        progressData.put("status", "downloading");
                        notifyListeners("qiraathDownloadProgress", progressData);
                    }
                }

                out.flush();
                out.close();
                out = null;

                // Validate downloaded file
                if (tempFile.length() == 0 || (totalBytes > 0 && tempFile.length() < totalBytes)) {
                    throw new Exception("Incomplete download: file size mismatch");
                }

                // Atomic rename to final file
                if (finalFile.exists()) {
                    finalFile.delete();
                }
                if (!tempFile.renameTo(finalFile)) {
                    throw new Exception("Failed to finalize downloaded file");
                }

                // Emit final success event
                JSObject successData = new JSObject();
                successData.put("key", downloadKey);
                successData.put("progress", 100);
                successData.put("bytesDownloaded", finalFile.length());
                successData.put("totalBytes", finalFile.length());
                successData.put("filePath", finalFile.getAbsolutePath());
                successData.put("status", "downloaded");
                notifyListeners("qiraathDownloadProgress", successData);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", finalFile.getAbsolutePath());
                res.put("fileSize", finalFile.length());
                call.resolve(res);

            } catch (InterruptedException ie) {
                if (tempFile.exists()) {
                    tempFile.delete();
                }
                JSObject cancelData = new JSObject();
                cancelData.put("key", downloadKey);
                cancelData.put("status", "cancelled");
                notifyListeners("qiraathDownloadProgress", cancelData);
                call.reject("Download cancelled");
            } catch (Exception e) {
                if (tempFile.exists()) {
                    tempFile.delete();
                }
                JSObject errorData = new JSObject();
                errorData.put("key", downloadKey);
                errorData.put("status", "error");
                errorData.put("error", e.getMessage());
                notifyListeners("qiraathDownloadProgress", errorData);
                call.reject("Download failed: " + e.getMessage(), e);
            } finally {
                try {
                    if (in != null) in.close();
                } catch (Exception ignored) {}
                try {
                    if (out != null) out.close();
                } catch (Exception ignored) {}
                if (connection != null) connection.disconnect();

                activeTasks.remove(downloadKey);
                cancelFlags.remove(downloadKey);
            }
        });

        activeTasks.put(downloadKey, task);
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("Key is required");
            return;
        }

        cancelFlags.put(key, true);
        Future<?> task = activeTasks.get(key);
        if (task != null) {
            task.cancel(true);
        }

        JSObject res = new JSObject();
        res.put("cancelled", true);
        call.resolve(res);
    }

    @PluginMethod
    public void checkAudioFile(PluginCall call) {
        String filename = call.getString("filename");
        if (filename == null || filename.isEmpty()) {
            call.reject("Filename is required");
            return;
        }

        File targetDir = getAudioDirectory();
        File file = new File(targetDir, filename);

        JSObject res = new JSObject();
        if (file.exists() && file.length() > 0) {
            res.put("exists", true);
            res.put("filePath", file.getAbsolutePath());
            res.put("fileSize", file.length());
        } else {
            res.put("exists", false);
        }
        call.resolve(res);
    }

    @PluginMethod
    public void deleteAudioFile(PluginCall call) {
        String filename = call.getString("filename");
        if (filename == null || filename.isEmpty()) {
            call.reject("Filename is required");
            return;
        }

        File targetDir = getAudioDirectory();
        File file = new File(targetDir, filename);
        File tempFile = new File(targetDir, filename + ".tmp");

        boolean deleted = false;
        if (file.exists()) {
            deleted = file.delete();
        }
        if (tempFile.exists()) {
            tempFile.delete();
        }

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("deleted", deleted);
        call.resolve(res);
    }

    @PluginMethod
    public void getDownloadedStorageSize(PluginCall call) {
        File targetDir = getAudioDirectory();
        File[] files = targetDir.listFiles();
        long totalSize = 0;
        int count = 0;

        if (files != null) {
            for (File f : files) {
                if (f.isFile() && !f.getName().endsWith(".tmp")) {
                    totalSize += f.length();
                    count++;
                }
            }
        }

        JSObject res = new JSObject();
        res.put("totalBytes", totalSize);
        res.put("fileCount", count);
        call.resolve(res);
    }
}
