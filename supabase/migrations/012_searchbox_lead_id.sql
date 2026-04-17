alter table public.searchbox_results
  add column lead_id uuid references public.leads(id) on delete set null;

create index searchbox_results_lead_id_idx on public.searchbox_results(lead_id)
  where lead_id is not null;
