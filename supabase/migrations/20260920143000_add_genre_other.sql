alter table events add column if not exists genre_other text;

alter table events drop constraint if exists events_genre_other_length_check;
alter table events add constraint events_genre_other_length_check check (
  genre_other is null or char_length(btrim(genre_other)) between 1 and 40
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
        'open_format',
        'other'
      ]::text[]
    );

    alter table events drop constraint if exists events_genre_other_presence_check;
    alter table events add constraint events_genre_other_presence_check check (
      ('other' = any (genres)) = (genre_other is not null)
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
        'open_format',
        'other'
      )
    );

    alter table events drop constraint if exists events_genre_other_presence_check;
    alter table events add constraint events_genre_other_presence_check check (
      (genre = 'other') = (genre_other is not null)
    );
  end if;
end $$;
