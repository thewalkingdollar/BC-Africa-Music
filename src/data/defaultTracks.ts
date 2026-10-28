import { Track } from '../types/music';
import { parseLRC } from '../utils/lrcParser';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'bc-track-1',
    title: 'Kilimanjaro Sun',
    artist: 'BC Africa All-Stars',
    album: 'Serengeti Horizons',
    genre: 'Amapiano',
    duration: 136,
    audioUrl: '', // generated on fly or fallback
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    uploadedAt: '2026-03-15',
    plays: 14200,
    isCustomUpload: false,
    lyricsRaw: `[00:00.00]♪ (Amapiano log drum intro & warm kalimba) ♪
[00:08.50]Rise with the morning light, shining bright
[00:13.20]From the peak of Kilimanjaro in the sky
[00:17.80]Feel the rhythm in your heart, don't let it die
[00:22.50]BC Africa, we fly so high!
[00:27.10]Dance to the baseline, feel the groove
[00:31.80]Every single heartbeat got something to prove
[00:36.40]From Nairobi to Dakar, everybody move
[00:41.00]Mama Africa got nothing to lose
[00:45.60]♪ (Instrumental log drum break & shakers) ♪
[00:54.80]Ngiyabonga, celebrate the new dawn
[00:59.40]Our ancestral spirit marching on and on
[01:04.10]Golden rays upon the savannah spread
[01:08.70]Singing sweet melodies where the river led
[01:13.40]Rise with the morning light, shining bright
[01:18.00]From the peak of Kilimanjaro in the sky
[01:22.60]Feel the rhythm in your heart, don't let it die
[01:27.20]BC Africa, we fly so high!
[01:31.90]♪ (Amapiano log drum outro & harmonic fade) ♪`,
    lyricsSynced: parseLRC(`[00:00.00]♪ (Amapiano log drum intro & warm kalimba) ♪
[00:08.50]Rise with the morning light, shining bright
[00:13.20]From the peak of Kilimanjaro in the sky
[00:17.80]Feel the rhythm in your heart, don't let it die
[00:22.50]BC Africa, we fly so high!
[00:27.10]Dance to the baseline, feel the groove
[00:31.80]Every single heartbeat got something to prove
[00:36.40]From Nairobi to Dakar, everybody move
[00:41.00]Mama Africa got nothing to lose
[00:45.60]♪ (Instrumental log drum break & shakers) ♪
[00:54.80]Ngiyabonga, celebrate the new dawn
[00:59.40]Our ancestral spirit marching on and on
[01:04.10]Golden rays upon the savannah spread
[01:08.70]Singing sweet melodies where the river led
[01:13.40]Rise with the morning light, shining bright
[01:18.00]From the peak of Kilimanjaro in the sky
[01:22.60]Feel the rhythm in your heart, don't let it die
[01:27.20]BC Africa, we fly so high!
[01:31.90]♪ (Amapiano log drum outro & harmonic fade) ♪`),
  },
  {
    id: 'bc-track-2',
    title: 'Lagos Island Vibe',
    artist: 'Amara & The Rhythm Kings',
    album: 'Afrobeat Odyssey',
    genre: 'Afrobeats',
    duration: 142,
    audioUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    uploadedAt: '2026-03-20',
    plays: 28900,
    isCustomUpload: false,
    lyricsRaw: `[00:00.00]♪ (Syncopated Afrobeat guitar riff & horns) ♪
[00:07.80]Third Mainland Bridge at 9 PM
[00:12.30]Radio playing that Afro anthem again
[00:16.80]Yellow Danfo buses under starry neon glare
[00:21.40]Electricity flowing through the coastal air
[00:25.90]Oya whine your waist to the melody
[00:30.50]This beautiful music is our remedy
[00:35.00]No wahala tonight, we free
[00:39.60]BC Africa sound is all I see!
[00:44.20]♪ (Afrobeat sax solo & talking drum) ♪
[00:53.40]Say na blessing, say na joy
[00:57.90]Every mother, girl and boy
[01:02.50]Raise your glasses up to the moon
[01:07.10]Morning sun will be coming soon
[01:11.60]Oya whine your waist to the melody
[01:16.20]This beautiful music is our remedy
[01:20.70]No wahala tonight, we free
[01:25.30]BC Africa sound is all I see!
[01:29.90]♪ (Outro crescendo & crowd cheers) ♪`,
    lyricsSynced: parseLRC(`[00:00.00]♪ (Syncopated Afrobeat guitar riff & horns) ♪
[00:07.80]Third Mainland Bridge at 9 PM
[00:12.30]Radio playing that Afro anthem again
[00:16.80]Yellow Danfo buses under starry neon glare
[00:21.40]Electricity flowing through the coastal air
[00:25.90]Oya whine your waist to the melody
[00:30.50]This beautiful music is our remedy
[00:35.00]No wahala tonight, we free
[00:39.60]BC Africa sound is all I see!
[00:44.20]♪ (Afrobeat sax solo & talking drum) ♪
[00:53.40]Say na blessing, say na joy
[00:57.90]Every mother, girl and boy
[01:02.50]Raise your glasses up to the moon
[01:07.10]Morning sun will be coming soon
[01:11.60]Oya whine your waist to the melody
[01:16.20]This beautiful music is our remedy
[01:20.70]No wahala tonight, we free
[01:25.30]BC Africa sound is all I see!
[01:29.90]♪ (Outro crescendo & crowd cheers) ♪`),
  },
  {
    id: 'bc-track-3',
    title: 'Nairobi Rain',
    artist: 'Zawadi feat. DJ Chuka',
    album: 'Equator Echoes',
    genre: 'Afro-Fusion',
    duration: 128,
    audioUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    uploadedAt: '2026-03-24',
    plays: 9840,
    isCustomUpload: false,
    lyricsRaw: `[00:00.00]♪ (Rain soundscape & acoustic guitar pluck) ♪
[00:06.50]Clouds rolling over Ngong hills today
[00:11.20]Washing the dust and worries away
[00:16.00]Sweet petrichor on the red clay ground
[00:20.70]Peace in the heartbeat of the sound
[00:25.50]Nakupenda sana, whisper in my ear
[00:30.20]When the storm is breaking, you are near
[00:35.00]Let the raindrops fall like tears of joy
[00:39.80]A rhythm no sorrow can destroy
[00:44.50]♪ (Kalimba arpeggio & bass swell) ♪
[00:54.00]Sun through the mist, illuminating bright
[00:58.80]Everything looks brand new in this light
[01:03.50]Nakupenda sana, whisper in my ear
[01:08.30]When the storm is breaking, you are near
[01:13.00]Let the raindrops fall like tears of joy
[01:17.80]A rhythm no sorrow can destroy
[01:22.50]♪ (Fading acoustic guitar & rain) ♪`,
    lyricsSynced: parseLRC(`[00:00.00]♪ (Rain soundscape & acoustic guitar pluck) ♪
[00:06.50]Clouds rolling over Ngong hills today
[00:11.20]Washing the dust and worries away
[00:16.00]Sweet petrichor on the red clay ground
[00:20.70]Peace in the heartbeat of the sound
[00:25.50]Nakupenda sana, whisper in my ear
[00:30.20]When the storm is breaking, you are near
[00:35.00]Let the raindrops fall like tears of joy
[00:39.80]A rhythm no sorrow can destroy
[00:44.50]♪ (Kalimba arpeggio & bass swell) ♪
[00:54.00]Sun through the mist, illuminating bright
[00:58.80]Everything looks brand new in this light
[01:03.50]Nakupenda sana, whisper in my ear
[01:08.30]When the storm is breaking, you are near
[01:13.00]Let the raindrops fall like tears of joy
[01:17.80]A rhythm no sorrow can destroy
[01:22.50]♪ (Fading acoustic guitar & rain) ♪`),
  },
  {
    id: 'bc-track-4',
    title: 'Kumasi Highlife Serenade',
    artist: 'Kwame & The Heritage Band',
    album: 'Golden Palm',
    genre: 'Highlife',
    duration: 132,
    audioUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
    uploadedAt: '2026-03-27',
    plays: 17300,
    isCustomUpload: false,
    lyricsRaw: `[00:00.00]♪ (Highlife interlocking guitars & congas) ♪
[00:08.00]Akwaaba to the palace of rhythm and grace
[00:13.20]Warm smiles on every lovely face
[00:18.40]Our fathers taught us how the horn must cry
[00:23.60]Beneath the endless West African sky
[00:28.80]Odo yewu, dance with me tonight
[00:34.00]Under palm fronds in the silver moonlight
[00:39.20]Tradition and tomorrow holding hands
[00:44.40]Spreading our joy to foreign lands
[00:49.60]♪ (Brass horn fanfare & dual guitar) ♪
[00:59.80]Sing it once again for the elders in the hall
[01:05.00]The drum will answer every single call
[01:10.20]Odo yewu, dance with me tonight
[01:15.40]Under palm fronds in the silver moonlight
[01:20.60]BC Africa playing highlife loud and clear!
[01:25.80]♪ (Rhythmic guitar outro) ♪`,
    lyricsSynced: parseLRC(`[00:00.00]♪ (Highlife interlocking guitars & congas) ♪
[00:08.00]Akwaaba to the palace of rhythm and grace
[00:13.20]Warm smiles on every lovely face
[00:18.40]Our fathers taught us how the horn must cry
[00:23.60]Beneath the endless West African sky
[00:28.80]Odo yewu, dance with me tonight
[00:34.00]Under palm fronds in the silver moonlight
[00:39.20]Tradition and tomorrow holding hands
[00:44.40]Spreading our joy to foreign lands
[00:49.60]♪ (Brass horn fanfare & dual guitar) ♪
[00:59.80]Sing it once again for the elders in the hall
[01:05.00]The drum will answer every single call
[01:10.20]Odo yewu, dance with me tonight
[01:15.40]Under palm fronds in the silver moonlight
[01:20.60]BC Africa playing highlife loud and clear!
[01:25.80]♪ (Rhythmic guitar outro) ♪`),
  },
  {
    id: 'bc-track-5',
    title: 'Mama Africa Cry No More',
    artist: 'BC Sound Collective',
    album: 'Voices of the Cradle',
    genre: 'Afro-Soul',
    duration: 138,
    audioUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    uploadedAt: '2026-03-28',
    plays: 31200,
    isCustomUpload: false,
    lyricsRaw: `[00:00.00]♪ (Soulful organ & deep acoustic cello) ♪
[00:09.00]Through the trials and centuries of tears
[00:14.50]You carried our ancestors across the years
[00:20.00]A mother resilient, unbreakable and bold
[00:25.50]With stories far greater than can be told
[00:31.00]Mama Africa, cry no more
[00:36.50]Joy has arrived at your golden door
[00:42.00]Your children are singing in harmony
[00:47.50]The spirit is soaring, proud and free
[00:53.00]♪ (Choir harmonies & rising percussion) ♪
[01:03.50]Listen to the voices from every coast and dune
[01:09.00]Rising in praise beneath the full moon
[01:14.50]Mama Africa, cry no more
[01:20.00]Joy has arrived at your golden door
[01:25.50]Your children are singing in harmony
[01:31.00]The spirit is soaring, proud and free!`,
    lyricsSynced: parseLRC(`[00:00.00]♪ (Soulful organ & deep acoustic cello) ♪
[00:09.00]Through the trials and centuries of tears
[00:14.50]You carried our ancestors across the years
[00:20.00]A mother resilient, unbreakable and bold
[00:25.50]With stories far greater than can be told
[00:31.00]Mama Africa, cry no more
[00:36.50]Joy has arrived at your golden door
[00:42.00]Your children are singing in harmony
[00:47.50]The spirit is soaring, proud and free
[00:53.00]♪ (Choir harmonies & rising percussion) ♪
[01:03.50]Listen to the voices from every coast and dune
[01:09.00]Rising in praise beneath the full moon
[01:14.50]Mama Africa, cry no more
[01:20.00]Joy has arrived at your golden door
[01:25.50]Your children are singing in harmony
[01:31.00]The spirit is soaring, proud and free!`),
  },
];
