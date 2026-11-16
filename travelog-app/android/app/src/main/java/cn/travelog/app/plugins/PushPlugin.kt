package cn.travelog.app.plugins

import android.Manifest
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Notification permission + token boundary.
 *
 * The token is intentionally not fabricated: wire Firebase Cloud Messaging (or
 * a domestic vendor channel) in this class once google-services.json is added.
 * Keeping the contract stable lets the web layer call `getToken()` today.
 */
@CapacitorPlugin(
    name = "TravelogPush",
    permissions = [
        Permission(
            alias = "notifications",
            strings = [],
            manifest = [Manifest.permission.POST_NOTIFICATIONS]
        )
    ]
)
class PushPlugin : Plugin() {

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            call.resolve(JSObject().put("granted", true).put("reason", "API < 33"))
            return
        }
        requestPermissionForAlias("notifications", call, "notificationPermission")
    }

    @PermissionCallback
    private fun notificationPermission(call: PluginCall) {
        val granted = getPermissionState("notifications").toString() == "GRANTED"
        call.resolve(JSObject().put("granted", granted))
    }

    @PluginMethod
    fun getToken(call: PluginCall) {
        call.resolve(
            JSObject()
                .put("token", "")
                .put("provider", "fcm")
                .put("configured", false)
                .put("message", "Add google-services.json and Firebase Messaging to enable push")
        )
    }
}
