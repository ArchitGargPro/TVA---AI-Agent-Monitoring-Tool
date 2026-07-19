#![cfg(target_os = "macos")]

use tauri::Manager;
use tauri::WebviewWindow;
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, PanelLevel, StyleMask, WebviewWindowExt,
};

mod elevate {
    use objc2_app_kit::{
        NSColor, NSMainMenuWindowLevel, NSWindow, NSWindowCollectionBehavior,
    };
    use tauri::WebviewWindow;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGShieldingWindowLevel() -> i32;
    }

    /// Elevate Miss Minutes above fullscreen Spaces (Zoom-style HUD).
    /// Must be called on the main thread only.
    pub fn elevate_for_fullscreen(window: &WebviewWindow) {
        let Ok(ptr) = window.ns_window() else {
            return;
        };
        if ptr.is_null() {
            return;
        }

        // SAFETY: ns_window pointer is owned by Tauri for the window lifetime.
        let ns_window = unsafe { &*(ptr as *const NSWindow) };

        // Transparent HUD chrome — required for overlays above fullscreen content.
        ns_window.setOpaque(false);
        ns_window.setBackgroundColor(Some(&NSColor::clearColor()));
        ns_window.setHasShadow(false);

        // Exact shielding level (not -1) sits above most fullscreen Spaces.
        let shielding = unsafe { CGShieldingWindowLevel() } as isize;
        let menu = NSMainMenuWindowLevel + 5;
        let level = if shielding > menu { shielding } else { menu };
        ns_window.setLevel(level);

        let behavior = NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::FullScreenAuxiliary
            | NSWindowCollectionBehavior::IgnoresCycle
            | NSWindowCollectionBehavior::Transient;
        ns_window.setCollectionBehavior(behavior);
        ns_window.setHidesOnDeactivate(false);
        ns_window.setCanHide(false);
        ns_window.orderFrontRegardless();
    }
}

pub use elevate::elevate_for_fullscreen;

tauri_panel! {
    panel!(MissMinutesPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })
}

/// Convert the fidget NSWindow into an NSPanel so it can appear over fullscreen Spaces.
/// Must run on the main thread.
pub fn convert_fidget_to_panel(window: &WebviewWindow) {
    let Ok(panel) = window.to_panel::<MissMinutesPanel>() else {
        return;
    };

    // Non-activating so clicks on Miss Minutes don't yank focus from Cursor mid-type.
    panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());
    panel.set_level(PanelLevel::MainMenu.value());
    panel.set_collection_behavior(
        CollectionBehavior::new()
            .full_screen_auxiliary()
            .can_join_all_spaces()
            .ignores_cycle()
            .into(),
    );
    panel.set_hides_on_deactivate(false);
    elevate_for_fullscreen(window);
}
