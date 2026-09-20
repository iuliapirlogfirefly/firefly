create or replace function events_within_distance(
  p_lat double precision,
  p_lng double precision,
  p_distance_km double precision
)
returns setof events as $$
begin
  return query
  select e.*
  from events e
  where e.status = 'published'
    and coalesce(e.ends_at, e.starts_at + interval '8 hours') > now()
    and st_dwithin(
      e.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_distance_km * 1000
    );
end;
$$ language plpgsql stable;
