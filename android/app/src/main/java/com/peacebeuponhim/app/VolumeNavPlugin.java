package com.peacebeuponhim.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native Volume Button Navigation Plugin for 13-Line Mushaf Reader.
 * Intercepts KEYCODE_VOLUME_UP and KEYCODE_VOLUME_DOWN only when active,
 * preventing system volume HUD while turning Quran pages.
 */
@CapacitorPlugin(name = "VolumeNav")
public class VolumeNavPlugin extends Plugin {
    private static volatile boolean intercepting = false;
    private static volatile boolean activeInReader = false;
    private static volatile VolumeNavPlugin instance = null;
    private static long lastPressTime = 0;
    private static final long DEBOUNCE_MS = 220;

    @Override
    public void load() {
        instance = this;
    }

    public static boolean isIntercepting() {
        return intercepting;
    }

    public static void setIntercepting(boolean enabled) {
        intercepting = enabled;
    }

    public static boolean isActiveInReader() {
        return activeInReader;
    }

    public static void onVolumeKey(String direction) {
        long now = System.currentTimeMillis();
        if (now - lastPressTime < DEBOUNCE_MS) {
            return;
        }
        lastPressTime = now;

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("direction", direction);
            instance.notifyListeners("volumeKey", ret, true);
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        activeInReader = true;
        intercepting = true;
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        activeInReader = false;
        intercepting = false;
        call.resolve();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", intercepting);
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        activeInReader = false;
        intercepting = false;
        instance = null;
        super.handleOnDestroy();
    }
}
