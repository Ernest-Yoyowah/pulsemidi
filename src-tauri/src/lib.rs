use midir::MidiInput;
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};


#[derive(Debug, Serialize, Clone)]
pub struct MidiPortInfo {
    pub index: usize,
    pub name: String,
}

#[derive(Serialize, Clone)]
struct MidiMessagePayload {
    #[serde(rename = "deviceId")]
    device_id: String,
    #[serde(rename = "deviceName")]
    device_name: String,
    timestamp: f64,
    data: Vec<u8>,
}

pub struct MidiState {
    connections: Vec<midir::MidiInputConnection<()>>,
}


fn new_midi_input(name: &str) -> Result<MidiInput, String> {
    MidiInput::new(name).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_midi_inputs() -> Vec<MidiPortInfo> {
    let Ok(midi_in) = new_midi_input("pulsemidi-list") else {
        return vec![];
    };
    midi_in
        .ports()
        .iter()
        .enumerate()
        .map(|(i, p)| MidiPortInfo {
            index: i,
            name: midi_in
                .port_name(p)
                .unwrap_or_else(|_| format!("MIDI Input {}", i + 1)),
        })
        .collect()
}


#[tauri::command]
fn connect_all_midi_inputs(
    app: AppHandle,
    state: State<'_, Mutex<MidiState>>,
) -> Result<Vec<MidiPortInfo>, String> {
    let mut midi_state = state.lock().map_err(|e| e.to_string())?;
    midi_state.connections.clear();

    let port_count = new_midi_input("pulsemidi-probe")?.ports().len();
    let mut connected: Vec<MidiPortInfo> = Vec::new();

    for idx in 0..port_count {
        let midi_in = new_midi_input(&format!("pulsemidi-{}", idx))?;
        let ports = midi_in.ports();
        if idx >= ports.len() {
            break;
        }

        let port = &ports[idx];
        let name = midi_in
            .port_name(port)
            .unwrap_or_else(|_| format!("MIDI Input {}", idx + 1));

        let dev_id = format!("port-{}", idx);
        let dev_name = name.clone();
        let app_clone = app.clone();

        match midi_in.connect(
            port,
            "pulsemidi-conn",
            move |ts, data, _| {
                let _ = app_clone.emit(
                    "midi-message",
                    MidiMessagePayload {
                        device_id: dev_id.clone(),
                        device_name: dev_name.clone(),
                        timestamp: ts as f64,
                        data: data.to_vec(),
                    },
                );
            },
            (),
        ) {
            Ok(conn) => {
                midi_state.connections.push(conn);
                connected.push(MidiPortInfo { index: idx, name });
            }
            Err(e) => eprintln!("[PulseMIDI] Port {} connect error: {}", idx, e),
        }
    }

    Ok(connected)
}


#[tauri::command]
fn connect_midi_input(
    port_index: usize,
    app: AppHandle,
    state: State<'_, Mutex<MidiState>>,
) -> Result<MidiPortInfo, String> {
    let mut midi_state = state.lock().map_err(|e| e.to_string())?;
    midi_state.connections.clear();

    let midi_in = new_midi_input(&format!("pulsemidi-single-{}", port_index))?;
    let ports = midi_in.ports();

    if port_index >= ports.len() {
        return Err(format!(
            "Port index {} out of range ({})",
            port_index,
            ports.len()
        ));
    }

    let port = &ports[port_index];
    let name = midi_in
        .port_name(port)
        .unwrap_or_else(|_| format!("MIDI Input {}", port_index + 1));

    let dev_id = format!("port-{}", port_index);
    let dev_name = name.clone();
    let app_clone = app.clone();

    let conn = midi_in
        .connect(
            port,
            "pulsemidi-conn",
            move |ts, data, _| {
                let _ = app_clone.emit(
                    "midi-message",
                    MidiMessagePayload {
                        device_id: dev_id.clone(),
                        device_name: dev_name.clone(),
                        timestamp: ts as f64,
                        data: data.to_vec(),
                    },
                );
            },
            (),
        )
        .map_err(|e| e.to_string())?;

    midi_state.connections.push(conn);
    Ok(MidiPortInfo { index: port_index, name })
}


#[tauri::command]
fn disconnect_all_midi_inputs(state: State<'_, Mutex<MidiState>>) -> Result<(), String> {
    let mut midi_state = state.lock().map_err(|e| e.to_string())?;
    midi_state.connections.clear();
    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(MidiState {
            connections: Vec::new(),
        }))
        .invoke_handler(tauri::generate_handler![
            list_midi_inputs,
            connect_all_midi_inputs,
            connect_midi_input,
            disconnect_all_midi_inputs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
