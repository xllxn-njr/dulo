import { Track } from '../types/music';

export const DEMO_TRACKS: Track[] = [
  {
    id: 'demo-obsidian-drift',
    videoId: 'jfKfPfyJRdk',
    title: 'Obsidian Drift',
    artist: 'Kaito Mori',
    album: 'Brutalist Studies',
    duration: 54,
    artwork: '/src/assets/images/cover_obsidian_drift_1794983242257.jpg',
    mood: 'Focus',
    source: 'demo',
    bitrate: '320 kbps',
    codec: 'PCM / AAC',
    demoProfile: { rootHz: 110, bpm: 78, character: 'ambient' },
    demoSponsorSegments: [
      {
        UUID: 'demo-sb-intro-1',
        category: 'intro',
        segment: [0, 6],
      },
    ],
    lrcText: `[00:00.00] [Intro ambience settling across concrete]
[00:06.20] Quiet concrete holds the afternoon sun
[00:11.80] Dust settles slow where the corridor turns
[00:17.50] Every echo folds back into stillness
[00:23.40] Breathe in the space between the frequencies
[00:29.10] Silver light across the stone floor
[00:35.00] Nothing moves faster than the shadow wants
[00:41.20] Hold the tone until the room goes dark
[00:47.50] Fading out into obsidian drift`,
  },
  {
    id: 'demo-lagos-pulse',
    videoId: '5qap5aO4i9A',
    title: 'Lagos Pulse (Analog Dub)',
    artist: 'Tunde Adebayo',
    album: 'Third Mainland Sessions',
    duration: 48,
    artwork: '/src/assets/images/cover_lagos_pulse_1794983242519.jpg',
    mood: 'Afro-Fusion',
    source: 'demo',
    bitrate: '256 kbps',
    codec: 'Opus / WAV',
    demoProfile: { rootHz: 123.47, bpm: 108, character: 'afro' },
    lrcText: `[00:01.00] Brass bell rings in the back of the studio
[00:06.80] Tape reels turning through the humid night
[00:12.40] Sub bass rolling down the Third Mainland bridge
[00:18.20] Hand drums answer every city light
[00:24.00] Keep the rhythm steady till the morning comes
[00:30.10] Analog warmth on the mixing console
[00:36.40] Lagos pulse never sleeps, it only breathes
[00:42.00] Let the percussion carry us home`,
  },
  {
    id: 'demo-velvet-static',
    videoId: 'DWcJFNfaw9c',
    title: 'Velvet Static',
    artist: 'Soren & Hale',
    album: 'Oscillator Works',
    duration: 52,
    artwork: '/src/assets/images/cover_velvet_static_1794983244488.jpg',
    mood: 'Late Night',
    source: 'demo',
    bitrate: '320 kbps',
    codec: 'FLAC / WAV',
    demoProfile: { rootHz: 98.0, bpm: 92, character: 'synth' },
    lrcText: `[00:01.20] Turn the filter down until the room hums
[00:07.10] Amber trace glowing on the glass screen
[00:13.00] Velvet static underneath the floorboards
[00:19.40] Two sine waves crossing in the midnight air
[00:25.80] Brushed aluminum cold beneath the fingertips
[00:32.00] Delay trails stretching out across the valley
[00:38.50] Stay awake with the quiet machines
[00:44.80] All signals clear till dawn`,
  },
  {
    id: 'demo-midnight-transit',
    videoId: 'lTRiuFIWV54',
    title: 'Midnight Transit',
    artist: 'Nadia Vance',
    album: 'Platform 04',
    duration: 50,
    artwork: '/src/assets/images/cover_midnight_transit_1794983243554.jpg',
    mood: 'Late Night',
    source: 'demo',
    bitrate: '256 kbps',
    codec: 'AAC / WAV',
    demoProfile: { rootHz: 103.83, bpm: 86, character: 'dub' },
    lrcText: `[00:01.50] Rain streaks down the last train glass
[00:07.40] Sodium lamps blur into silver lines
[00:13.60] Headphones on, the whole world slows down
[00:19.80] Every station feels a thousand miles away
[00:26.00] Wet asphalt shining below the overpass
[00:32.20] Counting beats between the tunnel lights
[00:38.40] Midnight transit carries quiet souls
[00:44.00] Next stop nowhere, stay a little longer`,
  },
  {
    id: 'demo-kinetic-form',
    videoId: '4xDzrJKXOOY',
    title: 'Kinetic Form',
    artist: 'Rami Koury',
    album: 'Monolith EP',
    duration: 46,
    artwork: '/src/assets/images/cover_kinetic_form_1794983244444.jpg',
    mood: 'Workout',
    source: 'demo',
    bitrate: '320 kbps',
    codec: 'Opus / WAV',
    demoProfile: { rootHz: 130.81, bpm: 126, character: 'kinetic' },
    lrcText: `[00:00.80] Lock the cadence, set the pace at zero
[00:06.00] Sharp rim light on the obsidian edge
[00:11.60] Push through the weight of the second mile
[00:17.20] Heartbeat locked to a hundred twenty-six
[00:22.80] No wasted motion, just clean kinetic form
[00:28.50] Breathe steady, keep your shoulders low
[00:34.20] Finish stronger than the moment we began
[00:40.00] Hold the line until the final bar`,
  },
  {
    id: 'demo-tape-echo',
    videoId: 'rUxyKA_-grg',
    title: 'Tape Echo 94',
    artist: 'Clara Lindqvist',
    album: 'Magnetic Archive',
    duration: 51,
    artwork: '/src/assets/images/cover_tape_echo_1794983244037.jpg',
    mood: 'Throwbacks',
    source: 'demo',
    bitrate: '256 kbps',
    codec: 'WAV / Tape',
    demoProfile: { rootHz: 116.54, bpm: 94, character: 'tape' },
    lrcText: `[00:01.00] Press record on the walnut reel machine
[00:06.90] Warm hiss rises before the chords arrive
[00:12.80] Ninety-four summers captured on quarter-inch tape
[00:18.90] VU needle dancing in the amber glow
[00:25.00] Memories loop gently without losing their grain
[00:31.20] Dust on the vinyl, gold on the sleeve
[00:37.50] Rewind the evening just one more time
[00:43.80] Let the tape echo fade to silence`,
  },
  {
    id: 'demo-sub-horizon',
    videoId: '7NOSDKb0HlU',
    title: 'Sub Horizon',
    artist: 'Kaito Mori',
    album: 'Brutalist Studies',
    duration: 44,
    artwork: '/src/assets/images/cover_obsidian_drift_1794983242257.jpg',
    mood: 'Focus',
    source: 'demo',
    bitrate: '320 kbps',
    codec: 'PCM / WAV',
    demoProfile: { rootHz: 92.5, bpm: 74, character: 'ambient' },
    lrcText: `[00:01.20] Deep below the surface noise
[00:08.00] Pure harmonic intervals align
[00:15.40] Zero distractions inside the frame
[00:22.60] Focus settles like still water
[00:30.00] Horizon line in monochrome grey
[00:37.20] Quiet clarity till the work is done`,
  },
  {
    id: 'demo-ekko-highlife',
    videoId: 'n61ULEU7CO0',
    title: 'Eko Night Drive',
    artist: 'Tunde Adebayo',
    album: 'Third Mainland Sessions',
    duration: 47,
    artwork: '/src/assets/images/cover_lagos_pulse_1794983242519.jpg',
    mood: 'Afro-Fusion',
    source: 'demo',
    bitrate: '256 kbps',
    codec: 'Opus / WAV',
    demoProfile: { rootHz: 138.59, bpm: 112, character: 'afro' },
    lrcText: `[00:01.00] Windows down along Victoria Island
[00:07.20] Warm chords floating over crisp shakers
[00:13.50] Gold reflections on the lagoon water
[00:20.00] Groove locked tight from dusk till midnight
[00:26.80] Eko night drive, effortless and free
[00:33.40] Turn the low end up on the bridge
[00:40.00] Riding the pocket until sunrise`,
  },
];

export const SMART_MIXES = [
  {
    id: 'mix-heavy-rotation',
    title: 'Heavy Rotation',
    subtitle: 'High-fidelity nocturnal electronics & analog dub',
    artwork: '/src/assets/images/cover_velvet_static_1794983244488.jpg',
    trackIds: ['demo-velvet-static', 'demo-lagos-pulse', 'demo-kinetic-form', 'demo-midnight-transit'],
  },
  {
    id: 'mix-forgotten-gems',
    title: 'Forgotten Gems',
    subtitle: 'Quarter-inch tape archives & deep focus studies',
    artwork: '/src/assets/images/cover_tape_echo_1794983244037.jpg',
    trackIds: ['demo-tape-echo', 'demo-obsidian-drift', 'demo-sub-horizon', 'demo-ekko-highlife'],
  },
];
