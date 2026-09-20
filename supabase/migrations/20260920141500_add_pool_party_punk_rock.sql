alter table events drop constraint if exists events_event_type_check;

alter table events add constraint events_event_type_check check (
  event_type in (
    'party',
    'concert',
    'festival',
    'rooftop',
    'brunch_day_party',
    'pool_party',
    'social_gathering',
    'club_night',
    'live_performance',
    'private_event'
  )
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'genres'
  ) then
    alter table events drop constraint if exists events_genres_check;
    alter table events add constraint events_genres_check check (
      cardinality(genres) >= 1
      and genres <@ array[
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
        'punk',
        'rock',
        'open_format'
      ]::text[]
    );
  else
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
        'punk',
        'rock',
        'open_format'
      )
    );
  end if;
end $$;
