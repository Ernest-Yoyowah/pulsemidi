use nih_plug::prelude::Editor;
use nih_plug_vizia::vizia::prelude::*;
use nih_plug_vizia::vizia::vg;
use nih_plug_vizia::{create_vizia_editor, ViziaState, ViziaTheming};
use std::sync::Arc;
use std::sync::atomic::Ordering;
use std::time::Duration;

use crate::{midi_utils::{detect_chord, note_name}, AtomicPluginState};

const WINDOW_WIDTH: u32 = 1050;
const WINDOW_HEIGHT: u32 = 650;
const KEYBOARD_HEIGHT: f32 = 130.0;

const STYLE: &str = r#"
* {
    font-family: "Inter", "Helvetica Neue", sans-serif;
}
.root {
    background-color: #06060a;
    width: 1050px;
    height: 650px;
    overflow: hidden;
}
.topbar {
    background-color: #0d0d12;
    border-bottom: 1px solid #1c1c22;
    height: 44px;
    padding-left: 20px;
    padding-right: 20px;
    child-space: 1s;
    col-between: 1s;
}
.title-pulse { color: #22d3ee; font-size: 14px; font-weight: 900; }
.title-midi  { color: #a1a1aa; font-size: 14px; }
.bpm-text    { color: #fbbf24; font-size: 22px; font-weight: 900; }
.stage {
    flex-grow: 1;
}
.wheels-left {
    width: 130px;
    border-right: 1px solid #1c1c22;
    padding-left: 10px;
    padding-right: 10px;
    child-space: 1s;
    col-between: 10px;
}
.wheel-col {
    width: 40px;
    row-between: 6px;
}
.brand-text {
    color: #3f3f46;
    font-size: 9px;
    letter-spacing: 2px;
}
.sustain-badge {
    color: #22d3ee;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    background-color: rgba(34, 211, 238, 0.12);
    border: 1px solid rgba(34, 211, 238, 0.25);
    border-radius: 4px;
    padding-left: 6px;
    padding-right: 6px;
    padding-top: 2px;
    padding-bottom: 2px;
}
.wheel-label {
    color: #3f3f46;
    font-size: 8px;
    letter-spacing: 2px;
    text-align: center;
    width: 40px;
}
.center {
    flex-grow: 1;
    child-space: 1s;
    row-between: 12px;
}
.chord-big {
    color: #f4f4f5;
    font-size: 88px;
    font-weight: 900;
    letter-spacing: -2px;
}
.chord-quality {
    color: #22d3ee;
    font-size: 52px;
    font-weight: 700;
}
.standby {
    color: #27272a;
    font-size: 24px;
    letter-spacing: 6px;
}
.notes-row {
    col-between: 6px;
    child-space: 1s;
}
.note-chip {
    color: #67e8f9;
    font-size: 12px;
    background-color: #0a2228;
    border: 1px solid #134e5a;
    border-radius: 5px;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-left: 10px;
    padding-right: 10px;
}
.color-btn {
    width: 14px;
    height: 14px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}
.pedal-strip {
    height: 50px;
    border-top: 1px solid #1c1c22;
    background-color: rgba(0, 0, 0, 0.25);
    child-space: 1s;
    col-between: 16px;
}
.pedal-btn {
    width: 100px;
    height: 32px;
    border-radius: 6px;
    background-color: #08080e;
    border: 1px solid #1c1c22;
    child-space: 1s;
    col-between: 6px;
}
.pedal-btn-active {
    width: 100px;
    height: 32px;
    border-radius: 6px;
    background-color: rgba(34, 211, 238, 0.07);
    border: 1px solid rgba(34, 211, 238, 0.25);
    child-space: 1s;
    col-between: 6px;
}
.pedal-dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background-color: #27272a;
}
.pedal-dot-active {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background-color: #22d3ee;
}
.pedal-lbl {
    color: #3f3f46;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 2px;
}
.pedal-lbl-active {
    color: #67e8f9;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 2px;
}
"#;

const KEY_COLORS: &[(u8, u8, u8)] = &[
    (34, 211, 238),
    (167, 139, 250),
    (52, 211, 153),
    (251, 191, 36),
    (248, 113, 113),
    (96, 165, 250),
    (249, 168, 212),
    (163, 230, 53),
];

#[derive(Lens, Clone)]
struct UiModel {
    chord: String,
    notes: Vec<String>,
    bpm_text: String,
    pitch_pct: f32,
    mod_pct: f32,
    right_bars: Vec<(String, f32)>,
    piano_states: Vec<(u8, u8)>,
    key_color_idx: u8,
    pedal_states: Vec<bool>,
    plugin_state: Arc<AtomicPluginState>,
}

#[derive(Debug)]
enum UiEvent {
    Tick,
    CycleColor,
}

impl Model for UiModel {
    fn event(&mut self, _cx: &mut EventContext, event: &mut Event) {
        event.map(|e: &UiEvent, _| match e {
            UiEvent::Tick => {
                let active = self.plugin_state.get_active_notes();

                self.chord = match detect_chord(&active) {
                    Some(c) => c.name,
                    None if active.len() == 1 => note_name(active[0]),
                    _ => String::new(),
                };

                self.notes = active.iter().map(|&n| note_name(n)).collect();
                self.piano_states = self.plugin_state.get_active_note_states();

                let bpm = self.plugin_state.bpm_raw.load(Ordering::Relaxed);
                self.bpm_text = if bpm > 0 {
                    format!("{} BPM", bpm)
                } else {
                    String::new()
                };

                let pb = self.plugin_state.pitch_bend.load(Ordering::Relaxed);
                self.pitch_pct = pb as f32 / 8192.0;

                let mod_val = self.plugin_state.cc[1].load(Ordering::Relaxed);
                self.mod_pct = mod_val as f32 / 127.0;

                self.right_bars = self.plugin_state.interesting_ccs();

                self.pedal_states = vec![
                    self.plugin_state.cc[64].load(Ordering::Relaxed) >= 64,
                    self.plugin_state.cc[66].load(Ordering::Relaxed) >= 64,
                    self.plugin_state.cc[67].load(Ordering::Relaxed) >= 64,
                    self.plugin_state.cc[65].load(Ordering::Relaxed) >= 64,
                ];

                self.key_color_idx = self.plugin_state.key_color_idx.load(Ordering::Relaxed);
            }
            UiEvent::CycleColor => {
                let next = (self.key_color_idx + 1) % KEY_COLORS.len() as u8;
                self.key_color_idx = next;
                self.plugin_state.key_color_idx.store(next, Ordering::Relaxed);
            }
        });
    }
}

pub fn create(
    editor_state: Arc<ViziaState>,
    plugin_state: Arc<AtomicPluginState>,
) -> Option<Box<dyn Editor>> {
    create_vizia_editor(
        editor_state,
        ViziaTheming::Custom,
        move |cx, _| {
            cx.add_stylesheet(STYLE).ok();

            UiModel {
                chord: String::new(),
                notes: Vec::new(),
                bpm_text: String::new(),
                pitch_pct: 0.0,
                mod_pct: 0.0,
                right_bars: Vec::new(),
                piano_states: Vec::new(),
                key_color_idx: 0,
                pedal_states: vec![false; 4],
                plugin_state: plugin_state.clone(),
            }
            .build(cx);

            cx.spawn(|proxy| loop {
                std::thread::sleep(Duration::from_millis(33));
                if proxy.emit(UiEvent::Tick).is_err() {
                    break;
                }
            });

            VStack::new(cx, |cx| {
                HStack::new(cx, |cx| {
                    HStack::new(cx, |cx| {
                        Label::new(cx, "PULSE").class("title-pulse");
                        Label::new(cx, "MIDI").class("title-midi");
                    })
                    .size(Auto)
                    .col_between(Pixels(0.0));

                    Label::new(cx, "ERNEST KEYZ STUDIOS").class("brand-text");

                    Binding::new(cx, UiModel::bpm_text, |cx, lens| {
                        let text = lens.get(cx);
                        if !text.is_empty() {
                            Label::new(cx, &text).class("bpm-text");
                        }
                    });

                    Binding::new(cx, UiModel::key_color_idx, |cx, lens| {
                        let idx = lens.get(cx) as usize;
                        let (kr, kg, kb) = KEY_COLORS[idx % KEY_COLORS.len()];
                        Element::new(cx)
                            .on_mouse_down(|cx, _| cx.emit(UiEvent::CycleColor))
                            .class("color-btn")
                            .background_color(Color::rgb(kr, kg, kb));
                    });
                })
                .class("topbar");

                HStack::new(cx, |cx| {
                    HStack::new(cx, |cx| {
                        Binding::new(cx, UiModel::pitch_pct, |cx, lens| {
                            let v = lens.get(cx);
                            render_wheel(cx, v, true, "PITCH", 40.0, 180.0);
                        });
                        Binding::new(cx, UiModel::mod_pct, |cx, lens| {
                            let v = lens.get(cx);
                            render_wheel(cx, v, false, "MOD", 40.0, 180.0);
                        });
                    })
                    .class("wheels-left");

                    VStack::new(cx, |cx| {
                        Binding::new(cx, UiModel::chord, |cx, lens| {
                            let chord = lens.get(cx);
                            if chord.is_empty() {
                                Label::new(cx, "STANDBY").class("standby");
                            } else {
                                Label::new(cx, &chord).class("chord-big");
                            }
                        });

                        Binding::new(cx, UiModel::notes, |cx, lens| {
                            let notes = lens.get(cx);
                            if !notes.is_empty() {
                                HStack::new(cx, move |cx| {
                                    for note in &notes {
                                        Label::new(cx, note).class("note-chip");
                                    }
                                })
                                .class("notes-row");
                            }
                        });
                    })
                    .class("center");

                    Binding::new(cx, UiModel::right_bars, |cx, lens| {
                        let bars = lens.get(cx);
                        HStack::new(cx, move |cx| {
                            for (label, value) in &bars {
                                render_wheel(cx, *value, false, label, 40.0, 120.0);
                            }
                        })
                        .class("wheels-right");
                    });
                })
                .class("stage");

                Binding::new(cx, UiModel::key_color_idx, |cx, color_lens| {
                    let color_idx = color_lens.get(cx);
                    Binding::new(cx, UiModel::piano_states, move |cx, states_lens| {
                        let states = states_lens.get(cx);
                        PianoKeys { states, color_idx }
                            .build(cx, |_| {})
                            .width(Pixels(WINDOW_WIDTH as f32))
                            .height(Pixels(KEYBOARD_HEIGHT));
                    });
                });

                Binding::new(cx, UiModel::pedal_states, |cx, lens| {
                    let pedal_states = lens.get(cx);
                    let labels = ["SUSTAIN", "SOSTENUTO", "SOFT PEDAL", "PORTAMENTO"];
                    HStack::new(cx, move |cx| {
                        for i in 0..4 {
                            let active = pedal_states.get(i).copied().unwrap_or(false);
                            let label = labels[i];
                            let btn_cls = if active { "pedal-btn-active" } else { "pedal-btn" };
                            let dot_cls = if active { "pedal-dot-active" } else { "pedal-dot" };
                            let lbl_cls = if active { "pedal-lbl-active" } else { "pedal-lbl" };
                            HStack::new(cx, move |cx| {
                                Element::new(cx).class(dot_cls);
                                Label::new(cx, label).class(lbl_cls);
                            })
                            .class(btn_cls);
                        }
                    })
                    .width(Pixels(WINDOW_WIDTH as f32))
                    .class("pedal-strip");
                });
            })
            .width(Pixels(WINDOW_WIDTH as f32))
            .height(Pixels(WINDOW_HEIGHT as f32))
            .class("root");
        },
    )
}



const PIANO_START: u8 = 21;
const PIANO_END: u8 = 108;

fn is_black_key(note: u8) -> bool {
    matches!(note % 12, 1 | 3 | 6 | 8 | 10)
}

struct PianoKeys {
    states: Vec<(u8, u8)>,
    color_idx: u8,
}

impl View for PianoKeys {
    fn draw(&self, cx: &mut DrawContext, canvas: &mut Canvas) {
        let bounds = cx.bounds();

        let white_keys: Vec<u8> = (PIANO_START..=PIANO_END)
            .filter(|&n| !is_black_key(n))
            .collect();
        let n_white = white_keys.len() as f32;
        let ww = bounds.w / n_white;
        let wh = bounds.h;
        let bw = ww * 0.58;
        let bh = wh * 0.62;

        let (kr, kg, kb) = KEY_COLORS[self.color_idx as usize % KEY_COLORS.len()];
        let active_map: std::collections::HashMap<u8, u8> =
            self.states.iter().cloned().collect();

        for (i, &note) in white_keys.iter().enumerate() {
            let x = bounds.x + i as f32 * ww;
            let fill = if let Some(&vel) = active_map.get(&note) {
                let v = vel as f32 / 127.0;
                let alpha = ((0.6 + v * 0.4) * 255.0) as u8;
                vg::Color::rgba(kr, kg, kb, alpha)
            } else {
                vg::Color::rgb(200, 200, 208)
            };
            let mut fill_path = vg::Path::new();
            fill_path.rect(x + 0.5, bounds.y + 0.5, ww - 1.5, wh - 1.0);
            canvas.fill_path(&fill_path, &vg::Paint::color(fill));

            let mut border = vg::Paint::color(vg::Color::rgb(60, 60, 75));
            border.set_line_width(1.0);
            let mut border_path = vg::Path::new();
            border_path.rect(x + 0.5, bounds.y + 0.5, ww - 1.5, wh - 1.0);
            canvas.stroke_path(&border_path, &border);
        }

        for (i, &note) in white_keys.iter().enumerate() {
            let black = note + 1;
            if black > PIANO_END || !is_black_key(black) {
                continue;
            }
            let bx = bounds.x + (i as f32 + 1.0) * ww - bw / 2.0;
            let fill = if let Some(&vel) = active_map.get(&black) {
                let v = vel as f32 / 127.0;
                let alpha = ((0.65 + v * 0.35) * 255.0) as u8;
                vg::Color::rgba(kr, kg, kb, alpha)
            } else {
                vg::Color::rgb(18, 18, 26)
            };
            let mut path = vg::Path::new();
            path.rect(bx, bounds.y, bw, bh);
            canvas.fill_path(&path, &vg::Paint::color(fill));
        }
    }
}

struct WheelCanvas {
    pct: f32,
    centered: bool,
}

impl View for WheelCanvas {
    fn draw(&self, cx: &mut DrawContext, canvas: &mut Canvas) {
        let b = cx.bounds();
        let x = b.x;
        let y = b.y;
        let w = b.w;
        let h = b.h;
        let r = (w / 2.0).min(20.0);

        // Housing background
        let mut bg = vg::Path::new();
        bg.rounded_rect(x, y, w, h, r);
        canvas.fill_path(&bg, &vg::Paint::color(vg::Color::rgba(8, 8, 14, 255)));

        // Color fill indicator
        if self.centered {
            let abs_pct = self.pct.abs().clamp(0.0, 1.0);
            if abs_pct > 0.02 {
                let fill_h = abs_pct * h / 2.0;
                let fill_y = if self.pct > 0.0 {
                    y + h / 2.0 - fill_h
                } else {
                    y + h / 2.0
                };
                let color = if self.pct > 0.0 {
                    vg::Color::rgba(34, 211, 238, 190)
                } else {
                    vg::Color::rgba(251, 191, 36, 190)
                };
                let mut fp = vg::Path::new();
                fp.rect(x + 1.5, fill_y, w - 3.0, fill_h);
                canvas.fill_path(&fp, &vg::Paint::color(color));
            }
        } else {
            let clamped = self.pct.clamp(0.0, 1.0);
            if clamped > 0.005 {
                let fill_h = clamped * h;
                let mut fp = vg::Path::new();
                fp.rect(x + 1.5, y + h - fill_h, w - 3.0, fill_h);
                canvas.fill_path(&fp, &vg::Paint::color(vg::Color::rgba(167, 139, 250, 170)));
            }
        }

        // Grip texture lines
        let line_spacing = 8.0_f32;
        let shift = (self.pct.abs() * 120.0) % line_spacing;
        let mut grip_path = vg::Path::new();
        let mut grip_y = y + shift;
        while grip_y < y + h {
            grip_path.move_to(x + 3.0, grip_y);
            grip_path.line_to(x + w - 3.0, grip_y);
            grip_y += line_spacing;
        }
        let mut grip_paint = vg::Paint::color(vg::Color::rgba(255, 255, 255, 16));
        grip_paint.set_line_width(1.5);
        canvas.stroke_path(&grip_path, &grip_paint);

        // Center tick for pitch bend
        if self.centered {
            let mut cp = vg::Path::new();
            cp.move_to(x + 3.0, y + h / 2.0);
            cp.line_to(x + w - 3.0, y + h / 2.0);
            let mut cp_paint = vg::Paint::color(vg::Color::rgba(255, 255, 255, 55));
            cp_paint.set_line_width(1.5);
            canvas.stroke_path(&cp, &cp_paint);
        }

        // Border
        let mut bp = vg::Paint::color(vg::Color::rgba(22, 22, 32, 220));
        bp.set_line_width(1.5);
        let mut bpath = vg::Path::new();
        bpath.rounded_rect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, r - 0.75);
        canvas.stroke_path(&bpath, &bp);
    }
}

fn render_wheel(cx: &mut Context, pct: f32, centered: bool, label: &str, wheel_w: f32, wheel_h: f32) {
    let label = label.to_string();
    VStack::new(cx, move |cx| {
        WheelCanvas { pct, centered }
            .build(cx, |_| {})
            .width(Pixels(wheel_w))
            .height(Pixels(wheel_h));
        Label::new(cx, &label).class("wheel-label");
    })
    .class("wheel-col");
}
