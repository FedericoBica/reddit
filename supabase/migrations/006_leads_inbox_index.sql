create index leads_project_status_intent_created_idx
  on public.leads(project_id, status, intent_score desc, created_at desc);
