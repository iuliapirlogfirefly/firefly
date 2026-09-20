-- Staging applied later genre migrations while `events.genre` was still text.
-- Finish the array rename (if needed) and restore the current check constraints.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'genre'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'genres'
  ) then
    alter table events drop constraint if exists events_genre_check;
    alter table events drop constraint if exists events_genre_other_presence_check;

    alter table events
      alter column genre type text[] using array[genre];

    alter table events rename column genre to genres;
  end if;

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

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'events'
        and column_name = 'genre_other'
    ) then
      alter table events drop constraint if exists events_genre_other_presence_check;
      alter table events add constraint events_genre_other_presence_check check (
        ('other' = any (genres)) = (genre_other is not null)
      );
    end if;
  end if;
end $$;

create index if not exists events_genres_gin on events using gin (genres);

notify pgrst, 'reload schema';
