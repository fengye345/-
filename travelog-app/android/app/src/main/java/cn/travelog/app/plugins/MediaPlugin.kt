package cn.travelog.app.plugins

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import androidx.activity.result.ActivityResult
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.io.File

/**
 * Gallery picker + camera capture. The returned content URI is consumed by the
 * web layer, which uploads it through a presigned URL (see API doc §6).
 */
@CapacitorPlugin(
    name = "TravelogMedia",
    permissions = [
        Permission(
            alias = "camera",
            strings = [],
            manifest = [Manifest.permission.CAMERA]
        )
    ]
)
class MediaPlugin : Plugin() {

    private var pendingPhotoUri: Uri? = null

    @PluginMethod
    fun pickImage(call: PluginCall) {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        intent.type = "image/*"
        startActivityForResult(call, intent, "pickImageResult")
    }

    @ActivityCallback
    private fun pickImageResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val uri = result.data?.data
        if (result.resultCode != Activity.RESULT_OK || uri == null) {
            call.reject("USER_CANCELLED", "未选择图片")
            return
        }
        call.resolve(JSObject().put("uri", uri.toString()))
    }

    @PluginMethod
    fun capturePhoto(call: PluginCall) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermission")
            return
        }
        launchCamera(call)
    }

    @PermissionCallback
    private fun cameraPermission(call: PluginCall) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            launchCamera(call)
        } else {
            call.reject("CAMERA_PERMISSION_DENIED", "请先授予相机权限")
        }
    }

    private fun launchCamera(call: PluginCall) {
        try {
            val dir = File(getContext().cacheDir, "images").apply { mkdirs() }
            val file = File(dir, "travelog_${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(
                getContext(),
                "${getContext().packageName}.fileprovider",
                file
            )
            pendingPhotoUri = uri
            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_OUTPUT, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            }
            startActivityForResult(call, intent, "captureResult")
        } catch (e: Exception) {
            call.reject("CAMERA_UNAVAILABLE", e.message)
        }
    }

    @ActivityCallback
    private fun captureResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val uri = pendingPhotoUri
        if (result.resultCode != Activity.RESULT_OK || uri == null) {
            call.reject("USER_CANCELLED", "未拍照")
            return
        }
        call.resolve(JSObject().put("uri", uri.toString()))
    }
}
