use nih_plug::prelude::*;
use nih_plug_vizia::ViziaState;
use std::num::NonZeroU32;
use std::sync::Arc;
use std::sync::atomic::{AtomicI32, AtomicU32, AtomicU64, AtomicU8, Ordering};

mod editor;
pub mod midi_utils;

use midi_utils::cc_name;

pub struct AtomicPluginState {
    pub notes_lo: AtomicU64, 
    pub notes_hi: AtomicU64, 
    pub pitch_bend: AtomicI32,
    pub bpm_raw: AtomicU32,
    pub cc: [AtomicU8; 128],
}

impl AtomicPluginState {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            notes_lo: AtomicU64::new(0),
            notes_hi: AtomicU64::new(0),
            pitch_bend: AtomicI32::new(0),
            bpm_raw: AtomicU32::new(0),
            cc: std::array::from_fn(|_| AtomicU8::new(0)),
        })
    }

    #[inline]
    pub fn set_note_on(&self, note: u8) {
        if note < 64 {
            self.notes_lo.fetch_or(1u64 << note, Ordering::Relaxed);
        } else {
            self.notes_hi.fetch_or(1u64 << (note - 64), Ordering::Relaxed);
        }
    }

    #[inline]
    pub fn set_note_off(&self, note: u8) {
        if note < 64 {
            self.notes_lo.fetch_and(!(1u64 << note), Ordering::Relaxed);
        } else {
            self.notes_hi.fetch_and(!(1u64 << (note - 64)), Ordering::Relaxed);
        }
    }

    #[inline]
    pub fn clear_notes(&self) {
        self.notes_lo.store(0, Ordering::Relaxed);
        self.notes_hi.store(0, Ordering::Relaxed);
    }

    pub fn get_active_notes(&self) -> Vec<u8> {
        let lo = self.notes_lo.load(Ordering::Relaxed);
        let hi = self.notes_hi.load(Ordering::Relaxed);
        let cap = lo.count_ones() as usize + hi.count_ones() as usize;
        let mut notes = Vec::with_capacity(cap);
        for i in 0u8..64 {
            if lo & (1u64 << i) != 0 {
                notes.push(i);
            }
        }
        for i in 0u8..64 {
            if hi & (1u64 << i) != 0 {
                notes.push(i + 64);
            }
        }
        notes
    }

    pub fn interesting_ccs(&self) -> Vec<(String, f32)> {
        const EXCLUDED: [u8; 8] = [0, 1, 64, 65, 66, 67, 68, 69];
        (0u8..=127)
            .filter(|cc| !EXCLUDED.contains(cc))
            .filter_map(|cc| {
                let v = self.cc[cc as usize].load(Ordering::Relaxed);
                if v > 0 {
                    Some((cc_name(cc), v as f32 / 127.0))
                } else {
                    None
                }
            })
            .take(2)
            .collect()
    }
}

pub struct PulseMidi {
    params: Arc<PulseMidiParams>,
    pub state: Arc<AtomicPluginState>,
}

#[derive(Params)]
pub struct PulseMidiParams {
    #[persist = "editor-state"]
    pub editor_state: Arc<ViziaState>,
}

impl Default for PulseMidiParams {
    fn default() -> Self {
        Self {
            editor_state: ViziaState::new(|| (1050, 600)),
        }
    }
}

impl Default for PulseMidi {
    fn default() -> Self {
        Self {
            params: Arc::new(PulseMidiParams::default()),
            state: AtomicPluginState::new(),
        }
    }
}

impl Plugin for PulseMidi {
    const NAME: &'static str = "PulseMIDI";
    const VENDOR: &'static str = "Ernest Keyz Studios";
    const URL: &'static str = env!("CARGO_PKG_HOMEPAGE");
    const EMAIL: &'static str = "";
    const VERSION: &'static str = env!("CARGO_PKG_VERSION");

    const AUDIO_IO_LAYOUTS: &'static [AudioIOLayout] = &[AudioIOLayout {
        main_input_channels: None,
        main_output_channels: NonZeroU32::new(2),
        ..AudioIOLayout::const_default()
    }];
    const MIDI_INPUT: MidiConfig = MidiConfig::MidiCCs;
    const MIDI_OUTPUT: MidiConfig = MidiConfig::None;
    const SAMPLE_ACCURATE_AUTOMATION: bool = false;

    type SysExMessage = ();
    type BackgroundTask = ();

    fn params(&self) -> Arc<dyn Params> {
        self.params.clone()
    }

    fn editor(&mut self, _async_executor: AsyncExecutor<Self>) -> Option<Box<dyn Editor>> {
        editor::create(self.params.editor_state.clone(), self.state.clone())
    }

    fn initialize(
        &mut self,
        _audio_io_layout: &AudioIOLayout,
        _buffer_config: &BufferConfig,
        _context: &mut impl InitContext<Self>,
    ) -> bool {
        true
    }

    fn reset(&mut self) {
        self.state.clear_notes();
        self.state.pitch_bend.store(0, Ordering::Relaxed);
    }

    fn process(
        &mut self,
        _buffer: &mut Buffer,
        _aux: &mut AuxiliaryBuffers,
        context: &mut impl ProcessContext<Self>,
    ) -> ProcessStatus {
        if let Some(tempo) = context.transport().tempo {
            self.state.bpm_raw.store(tempo.round() as u32, Ordering::Relaxed);
        }

        while let Some(event) = context.next_event() {
            match event {
                NoteEvent::NoteOn { note, .. } => {
                    self.state.set_note_on(note);
                }
                NoteEvent::NoteOff { note, .. } => {
                    self.state.set_note_off(note);
                }
                NoteEvent::MidiCC { cc, value, .. } => {
                    let raw = (value * 127.0).round() as u8;
                    self.state.cc[cc as usize].store(raw, Ordering::Relaxed);
                }
                NoteEvent::MidiPitchBend { value, .. } => {
                    let pb = ((value - 0.5) * 2.0 * 8192.0) as i32;
                    self.state.pitch_bend.store(pb, Ordering::Relaxed);
                }
                _ => {}
            }
        }

        ProcessStatus::KeepAlive
    }
}

impl ClapPlugin for PulseMidi {
    const CLAP_ID: &'static str = "com.pulsemidi.vst";
    const CLAP_DESCRIPTION: Option<&'static str> = Some("Real-time MIDI visualizer, chord detector, and performance monitor by Ernest Keyz Studios");
    const CLAP_MANUAL_URL: Option<&'static str> = None;
    const CLAP_SUPPORT_URL: Option<&'static str> = None;
    const CLAP_FEATURES: &'static [ClapFeature] = &[ClapFeature::NoteEffect, ClapFeature::Analyzer];
}

impl Vst3Plugin for PulseMidi {
    const VST3_CLASS_ID: [u8; 16] = *b"PulseMIDIPlugin!";
    const VST3_SUBCATEGORIES: &'static [Vst3SubCategory] =
        &[Vst3SubCategory::Instrument, Vst3SubCategory::Analyzer];
}

nih_export_clap!(PulseMidi);
nih_export_vst3!(PulseMidi);
