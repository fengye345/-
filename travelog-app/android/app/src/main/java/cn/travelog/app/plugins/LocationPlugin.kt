package cn.travelog.app.plugins

import android.Manifest
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Foreground + background location bridge.
 *
 * The PRD requires raw points to be uploaded in batches and judged on the
 * server. The plugin therefore only emits points; it never decides whether a
 * city is lit. A production build should replace the polling interval with
 * Geofencing + FusedLocationProvider when Play Services is available.
 */
@CapacitorPlugin(
    name = "TravelogLocation",
    permissions = [
        Permission(
            alias = "location",
            strings = [],
            manifest = [
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ]
        )
    ]
)
class LocationPlugin : Plugin() {

    private var listener: LocationListener? = null

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        call.resolve(JSObject().put("state", getPermissionState("location").toString()))
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            call.resolve(JSObject().put("granted", true))
            return
        }
        requestPermissionForAlias("location", call, "locationPermission")
    }

    @PermissionCallback
    private fun locationPermission(call: PluginCall) {
        call.resolve(
            JSObject().put("granted", getPermissionState("location") == PermissionState.GRANTED)
        )
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("LOCATION_PERMISSION_DENIED", "请先授予定位权限")
            return
        }
        val manager = getContext().getSystemService(Context.LOCATION_SERVICE) as LocationManager
        stopUpdates(manager)

        listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                emit(location)
            }

            override fun onProviderDisabled(provider: String) {
                notifyListeners("providerDisabled", JSObject().put("provider", provider))
            }

            override fun onProviderEnabled(provider: String) {
                notifyListeners("providerEnabled", JSObject().put("provider", provider))
            }

            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
                // no-op
            }
        }

        try {
            manager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                10_000L,
                25f,
                listener!!,
                Looper.getMainLooper()
            )
            manager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                30_000L,
                50f,
                listener!!,
                Looper.getMainLooper()
            )
            manager.getLastKnownLocation(LocationManager.GPS_PROVIDER)?.let { emit(it) }
            call.resolve(JSObject().put("started", true))
        } catch (e: SecurityException) {
            call.reject("LOCATION_DENIED", e.message)
        } catch (e: Exception) {
            call.reject("LOCATION_UNAVAILABLE", e.message)
        }
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val manager = getContext().getSystemService(Context.LOCATION_SERVICE) as LocationManager
        stopUpdates(manager)
        call.resolve(JSObject().put("stopped", true))
    }

    @PluginMethod
    fun getLastKnown(call: PluginCall) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("LOCATION_PERMISSION_DENIED")
            return
        }
        val manager = getContext().getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val location = try {
            manager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
        } catch (e: SecurityException) {
            null
        }
        if (location == null) {
            call.resolve(JSObject().put("location", null))
        } else {
            call.resolve(JSObject().put("location", toJson(location)))
        }
    }

    private fun stopUpdates(manager: LocationManager) {
        listener?.let {
            try {
                manager.removeUpdates(it)
            } catch (_: Exception) {
            }
        }
        listener = null
    }

    private fun emit(location: Location) {
        notifyListeners("location", toJson(location))
    }

    private fun toJson(location: Location): JSObject {
        return JSObject()
            .put("lat", location.latitude)
            .put("lng", location.longitude)
            .put("accuracy", location.accuracy.toDouble())
            .put("capturedAtMs", location.time)
            .put("provider", location.provider ?: "unknown")
            .put("mock", location.isFromMockProvider)
    }
}
