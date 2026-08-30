alter table events drop constraint if exists events_genre_check;

alter table events add constraint events_genre_check check (
  genre in (
    'techno',
    'house',
    'afro_house',
    'minimal',
    'hip_hop_rnb',
    'commercial',
    'latin',
    'manele',
    'pop',
    'edm',
    'live_music',
    'jazz',
    'open_format'
  )
);
