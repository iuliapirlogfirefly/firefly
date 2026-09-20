alter table events
  add column if not exists price_options jsonb not null default '[]'::jsonb;

alter table events drop constraint if exists events_price_options_is_array;
alter table events add constraint events_price_options_is_array check (
  jsonb_typeof(price_options) = 'array'
  and jsonb_array_length(price_options) <= 8
);
