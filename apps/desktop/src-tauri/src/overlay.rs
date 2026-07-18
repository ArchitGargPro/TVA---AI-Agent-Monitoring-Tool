#![cfg(target_os = "macos")]

use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};
use tauri::WebviewWindow;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGShieldingWindowLevel() -> i32;
}

/// Elevate Miss Minutes above fullscreen Spaces (Zoom-style HUD).
pub fn elevate_for_fullscreen(window: &WebviewWindow) {
    let Ok(ptr) = window.ns_window() else {
        return;
    };
    if ptr.is_null() {
        return;
    }

    // SAFETY: ns_window pointer is owned by Tauri for the window lifetime.
    let ns_window = unsafe { &*(ptr as *const NSWindow) };

    // Shielding level sits above almost all fullscreen content.
    let level = unsafe { CGShieldingWindowLevel() } - 1;
    ns_window.setLevel(level as isize);

    let behavior = ns_window.collectionBehavior()
        | NSWindowCollectionBehavior::CanJoinAllSpaces
        | NSWindowCollectionBehavior::Stationary
        | NSWindowCollectionBehavior::FullScreenAuxiliary
        | NSWindowCollectionBehavior::IgnoresCycle;
    ns_window.setCollectionBehavior(behavior);
    ns_window.setHidesOnDeactivate(false);
    ns_window.setCanHide(false);
}
