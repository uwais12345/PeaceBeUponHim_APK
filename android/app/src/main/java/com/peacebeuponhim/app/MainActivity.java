package com.peacebeuponhim.app;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(VolumeNavPlugin.class);
        registerPlugin(MediaDownloadPlugin.class);
        registerPlugin(QiraathDownloadPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (VolumeNavPlugin.isIntercepting() && event.getRepeatCount() == 0) {
            if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
                VolumeNavPlugin.onVolumeKey("up");
                return true;
            } else if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
                VolumeNavPlugin.onVolumeKey("down");
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (VolumeNavPlugin.isIntercepting()) {
            if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
                return true;
            }
        }
        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onPause() {
        super.onPause();
        // Release hardware volume key interception when app is paused/backgrounded
        VolumeNavPlugin.setIntercepting(false);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-enable hardware volume key interception only if user was actively reading Mushaf
        if (VolumeNavPlugin.isActiveInReader()) {
            VolumeNavPlugin.setIntercepting(true);
        }
    }
}
