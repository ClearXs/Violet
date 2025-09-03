use tauri::{window::Color, Manager, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

const VIOLET_WIDTH: f64 = 800.0;
const VIOLET_HEIGHT: f64 = 600.0;

#[tauri::command]
fn reveal_finder(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    app_handle.opener().open_path(path, None::<&str>);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .setup(|app| {
        //     let primary = app
        //         .get_webview_window("main")
        //         .unwrap()
        //         .primary_monitor()
        //         .unwrap()
        //         .expect("Failed to get primary monitor");
        //     let size = primary.size(); // 屏幕大小
        //     let violet_window =
        //         WebviewWindowBuilder::new(app, "violet", tauri::WebviewUrl::App("/".into()))
        //             .decorations(false)
        //             .inner_size(VIOLET_WIDTH, VIOLET_HEIGHT)
        //             .position(
        //                 size.width as f64 - VIOLET_WIDTH - 20.0,
        //                 size.height as f64 - VIOLET_HEIGHT - 40.0,
        //             )
        //             .background_color(Color(0, 0, 0, 0))
        //             .always_on_top(true)
        //             .build()?;
        //     WebviewWindowBuilder::new(app, "settings", tauri::WebviewUrl::App("/settings".into()))
        //         .resizable(true)
        //         .build()?;
        //     Ok(())
        // })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![reveal_finder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
