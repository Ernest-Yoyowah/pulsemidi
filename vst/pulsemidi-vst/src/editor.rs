use nih_plug::prelude::Editor;
use nih_plug_vizia::vizia::prelude::*;
use nih_plug_vizia::vizia::vg;
use nih_plug_vizia::{create_vizia_editor, ViziaState, ViziaTheming};
use std::sync::Arc;
use std::sync::atomic::Ordering;
use std::time::Duration;

use crate::{midi_utils::{detect_chord, note_name}, AtomicPluginState};

const WINDOW_WIDTH: u32 = 1050;
const WINDOW_HEIGHT: u32 = 600;
const KEYBOARD_HEIGHT: f32 = 110.0;

const STYLE: &str = r#"
* {
    font-family: "Inter", "Helvetica Neue", sans-serif;
}
.root {
    background-color: #06060a;
    width: 1050px;
    height: 600px;
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
    width: 90px;
    border-right: 1px solid #1c1c22;
    padding-left: 12px;
    padding-right: 12px;
    child-space: 1s;
    col-between: 10px;
}
.wheels-right {
    width: 90px;
    border-left: 1px solid #1c1c22;
    padding-left: 12px;
    padding-right: 12px;
    child-space: 1s;
    col-between: 10px;
}
.wheel-col {
    width: 22px;
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
    width: 22px;
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
"#;

#[derive(Lens, Clone)]
struct UiModel {
    chord: String,
    notes: Vec<String>,
    bpm_text: String,
    pitch_pct: f32,
    mod_pct: f32,
    right_bars: Vec<(String, f32)>,
    active_note_numbers: Vec<u8>,
    sustain: bool,
    plugin_state: Arc<AtomicPluginState>,
}

#[derive(Debug)]
enum UiEvent {
    Tick,
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
                self.active_note_numbers = active;

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

                let sus = self.plugin_state.cc[64].load(Ordering::Relaxed);
                self.sustain = sus >= 64;
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
                active_note_numbers: Vec::new(),
                sustain: false,
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

                    Binding::new(cx, UiModel::sustain, |cx, lens| {
                        if lens.get(cx) {
                            Label::new(cx, "\u{2299} SUS").class("sustain-badge");
                        }
                    });

                    Binding::new(cx, UiModel::bpm_text, |cx, lens| {
                        let text = lens.get(cx);
                        if !text.is_empty() {
                            Label::new(cx, &text).class("bpm-text");
                        }
                    });
                })
                .class("topbar");

                HStack::new(cx, |cx| {
                    HStack::new(cx, |cx| {
                        Binding::new(cx, UiModel::pitch_pct, |cx, lens| {
                            let v = lens.get(cx);
                            render_wheel(cx, v, true, "PITCH");
                        });
                        Binding::new(cx, UiModel::mod_pct, |cx, lens| {
                            let v = lens.get(cx);
                            render_wheel(cx, v, false, "MOD");
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
                                render_wheel(cx, *value, false, label);
                            }
                        })
                        .class("wheels-right");
                    });
                })
                .class("stage");

                Binding::new(cx, UiModel::active_note_numbers, |cx, lens| {
                    let active = lens.get(cx);
                    PianoKeys { active }.build(cx, |_| {})
                        .width(Pixels(WINDOW_WIDTH as f32))
                        .height(Pixels(KEYBOARD_HEIGHT));
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
    active: Vec<u8>,
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


        for (i, &note) in white_keys.iter().enumerate() {
            let x = bounds.x + i as f32 * ww;
            let active = self.active.contains(&note);

            let fill = if active {
                vg::Color::rgba(34, 211, 238, 210)
            } else {
                vg::Color::rgb(200, 200, 208)
            };
            let mut path = vg::Path::new();
            path.rect(x + 0.5, bounds.y + 0.5, ww - 1.5, wh - 1.0);
            canvas.fill_path(&path, &vg::Paint::color(fill));

            let mut border = vg::Paint::color(vg::Color::rgb(60, 60, 75));
            border.set_line_width(1.0);
            let mut path = vg::Path::new();
            path.rect(x + 0.5, bounds.y + 0.5, ww - 1.5, wh - 1.0);
            canvas.stroke_path(&path, &border);
        }


        for (i, &note) in white_keys.iter().enumerate() {
            let black = note + 1;
            if black > PIANO_END || !is_black_key(black) {
                continue;
            }
            let bx = bounds.x + (i as f32 + 1.0) * ww - bw / 2.0;
            let active = self.active.contains(&black);

            let fill = if active {
                vg::Color::rgba(34, 211, 238, 220)
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
        let r = (w / 2.0).min(11.0);

        // Background
        let mut bg = vg::Path::new();
        bg.rounded_rect(x, y, w, h, r);
        canvas.fill_path(&bg, &vg::Paint::color(vg::Color::rgba(14, 14, 20, 255)));

        if self.centered {
            let abs_pct = self.pct.abs().clamp(0.0, 1.0);
            if abs_pct > 0.02 {
                let fill_h = abs_pct * h / 2.0;
                // Positive = wheel pushed UP → fill ABOVE center line
                // Negative = wheel pushed DOWN → fill BELOW center line
                let fill_y = if self.pct > 0.0 {
                    y + h / 2.0 - fill_h
                } else {
                    y + h / 2.0
                };
                let color = if self.pct > 0.0 {
                    vg::Color::rgba(34, 211, 238, 200)
                } else {
                    vg::Color::rgba(251, 191, 36, 200)
                };
                let mut fp = vg::Path::new();
                fp.rect(x + 1.0, fill_y, w - 2.0, fill_h);
                canvas.fill_path(&fp, &vg::Paint::color(color));
            }
            // Center line
            let mut cp = vg::Path::new();
            cp.rect(x, y + h / 2.0 - 0.5, w, 1.0);
            canvas.fill_path(&cp, &vg::Paint::color(vg::Color::rgba(255, 255, 255, 38)));
        } else {
            let clamped = self.pct.clamp(0.0, 1.0);
            if clamped > 0.005 {
                let fill_h = clamped * h;
                let mut fp = vg::Path::new();
                fp.rect(x + 1.0, y + h - fill_h, w - 2.0, fill_h);
                canvas.fill_path(&fp, &vg::Paint::color(vg::Color::rgba(34, 211, 238, 160)));
            }
        }

        // Border overlay
        let mut bp = vg::Paint::color(vg::Color::rgba(32, 32, 40, 200));
        bp.set_line_width(1.0);
        let mut bpath = vg::Path::new();
        bpath.rounded_rect(x + 0.5, y + 0.5, w - 1.0, h - 1.0, r - 0.5);
        canvas.stroke_path(&bpath, &bp);
    }
}

fn render_wheel(cx: &mut Context, pct: f32, centered: bool, label: &str) {
    let label = label.to_string();
    VStack::new(cx, move |cx| {
        WheelCanvas { pct, centered }
            .build(cx, |_| {})
            .width(Pixels(22.0))
            .height(Pixels(140.0));
        Label::new(cx, &label).class("wheel-label");
    })
    .class("wheel-col");
}
