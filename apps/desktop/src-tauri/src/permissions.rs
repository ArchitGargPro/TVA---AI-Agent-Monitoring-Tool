#![cfg(target_os = "macos")]

use serde::Serialize;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};

#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
    fn CGWindowListCopyWindowInfo(option: u32, relative_to_window: u32) -> *const c_void;
}

#[link(name = "CoreFoundation", kind = "framework")]
extern "C" {
    fn CFArrayGetCount(the_array: *const c_void) -> isize;
    fn CFArrayGetValueAtIndex(the_array: *const c_void, idx: isize) -> *const c_void;
    fn CFDictionaryGetValue(the_dict: *const c_void, key: *const c_void) -> *const c_void;
    fn CFRelease(cf_type: *const c_void);
    fn CFStringCreateWithCString(
        alloc: *const c_void,
        c_str: *const c_char,
        encoding: u32,
    ) -> *const c_void;
    fn CFStringGetCString(
        the_string: *const c_void,
        buffer: *mut c_char,
        buffer_size: isize,
        encoding: u32,
    ) -> bool;
}

const K_CF_STRING_ENCODING_UTF8: u32 = 0x0800_0100;
const K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY: u32 = 1 << 0;

/// Cached after a successful probe/request — CGPreflight is unreliable for ad-hoc signed apps.
static SCREEN_RECORDING_CACHED: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    pub accessibility: bool,
    pub screen_recording: bool,
}

pub fn get_permission_status() -> PermissionStatus {
    let accessibility = unsafe { AXIsProcessTrusted() } || system_events_reachable();
    let screen_recording = screen_recording_granted();
    PermissionStatus {
        accessibility,
        screen_recording,
    }
}

fn screen_recording_granted() -> bool {
    if SCREEN_RECORDING_CACHED.load(Ordering::SeqCst) {
        return true;
    }
    if unsafe { CGPreflightScreenCaptureAccess() } {
        SCREEN_RECORDING_CACHED.store(true, Ordering::SeqCst);
        return true;
    }
    // Runtime truth: with Screen Recording, other apps' window titles are visible.
    if probe_screen_recording_via_window_list() {
        SCREEN_RECORDING_CACHED.store(true, Ordering::SeqCst);
        return true;
    }
    false
}

/// Without Screen Recording, macOS redacts `kCGWindowName` for other processes.
fn probe_screen_recording_via_window_list() -> bool {
    unsafe {
        let array = CGWindowListCopyWindowInfo(K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY, 0);
        if array.is_null() {
            return false;
        }

        let key_name = cf_string("kCGWindowName");
        let key_owner = cf_string("kCGWindowOwnerName");
        if key_name.is_null() || key_owner.is_null() {
            CFRelease(array);
            if !key_name.is_null() {
                CFRelease(key_name);
            }
            if !key_owner.is_null() {
                CFRelease(key_owner);
            }
            return false;
        }

        let count = CFArrayGetCount(array);
        let mut granted = false;
        for index in 0..count {
            let dict = CFArrayGetValueAtIndex(array, index);
            if dict.is_null() {
                continue;
            }
            let owner = cf_dict_string(dict, key_owner).unwrap_or_default();
            if owner.is_empty() || is_our_process(&owner) {
                continue;
            }
            if let Some(name) = cf_dict_string(dict, key_name) {
                if !name.is_empty() {
                    granted = true;
                    break;
                }
            }
        }

        CFRelease(key_name);
        CFRelease(key_owner);
        CFRelease(array);
        granted
    }
}

fn is_our_process(owner: &str) -> bool {
    let lower = owner.to_ascii_lowercase();
    lower.contains("minutecontrol") || lower.contains("mission-control") || lower.contains("mission_control")
}

unsafe fn cf_string(value: &str) -> *const c_void {
    let Ok(c_string) = CString::new(value) else {
        return std::ptr::null();
    };
    CFStringCreateWithCString(std::ptr::null(), c_string.as_ptr(), K_CF_STRING_ENCODING_UTF8)
}

unsafe fn cf_dict_string(dict: *const c_void, key: *const c_void) -> Option<String> {
    let value = CFDictionaryGetValue(dict, key);
    if value.is_null() {
        return None;
    }
    let mut buffer = [0i8; 512];
    if !CFStringGetCString(
        value,
        buffer.as_mut_ptr(),
        buffer.len() as isize,
        K_CF_STRING_ENCODING_UTF8,
    ) {
        return None;
    }
    let c_str = CStr::from_ptr(buffer.as_ptr());
    Some(c_str.to_string_lossy().into_owned())
}

fn system_events_reachable() -> bool {
    Command::new("osascript")
        .args([
            "-e",
            r#"tell application "System Events" to get name of first process"#,
        ])
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Prompt / refresh Screen Recording. Safe to call on Miss Minutes launch.
/// If the user already enabled it in Settings, this returns true without a dialog.
pub fn request_screen_recording_if_needed() {
    if screen_recording_granted() {
        return;
    }
    // Returns true when already authorized (even when Preflight lies for ad-hoc builds).
    let ok = unsafe { CGRequestScreenCaptureAccess() };
    if ok {
        SCREEN_RECORDING_CACHED.store(true, Ordering::SeqCst);
    }
}

/// Manual confirm for TCC edge cases where Settings shows On but APIs still lie.
pub fn confirm_screen_recording() {
    SCREEN_RECORDING_CACHED.store(true, Ordering::SeqCst);
}

pub fn open_permission_settings(kind: &str) -> Result<(), String> {
    // When opening Screen Recording settings, also refresh the TCC grant cache.
    if kind == "screenRecording" {
        request_screen_recording_if_needed();
    }

    let url = match kind {
        "accessibility" => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
        }
        "screenRecording" => {
            "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
        }
        _ => {
            return Err(format!("Unknown permission kind: {kind}"));
        }
    };

    let status = Command::new("open")
        .arg(url)
        .status()
        .map_err(|error| error.to_string())?;

    if !status.success() {
        let fallback = match kind {
            "accessibility" => {
                "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Accessibility"
            }
            "screenRecording" => {
                "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_ScreenCapture"
            }
            _ => url,
        };
        Command::new("open")
            .arg(fallback)
            .status()
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}
