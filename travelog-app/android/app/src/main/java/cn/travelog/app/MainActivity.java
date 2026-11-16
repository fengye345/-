package cn.travelog.app;

import android.os.Bundle;
import cn.travelog.app.plugins.LocationPlugin;
import cn.travelog.app.plugins.MediaPlugin;
import cn.travelog.app.plugins.PushPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationPlugin.class);
        registerPlugin(MediaPlugin.class);
        registerPlugin(PushPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
