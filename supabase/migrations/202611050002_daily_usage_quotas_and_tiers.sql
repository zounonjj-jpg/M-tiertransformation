alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free','pro','elite'));

create or replace function public.consume_daily_quota(p_kind text)
returns table(allowed boolean, used integer, daily_limit integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_limit integer;
  v_used integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_kind not in ('image_generations','imports') then raise exception 'Unsupported quota type'; end if;
  select coalesce(subscription_tier,'free') into v_plan from public.profiles where id = v_user;
  v_plan := coalesce(v_plan,'free');
  if p_kind = 'image_generations' then
    v_limit := case v_plan when 'elite' then 100 when 'pro' then 30 else 3 end;
  else
    v_limit := case v_plan when 'elite' then 300 when 'pro' then 100 else 3 end;
  end if;
  insert into public.user_daily_usage(user_id,usage_date) values (v_user,current_date)
    on conflict (user_id,usage_date) do nothing;
  if p_kind = 'image_generations' then
    update public.user_daily_usage set image_generations=image_generations+1
      where user_id=v_user and usage_date=current_date and image_generations<v_limit
      returning image_generations into v_used;
  else
    update public.user_daily_usage set imports=imports+1
      where user_id=v_user and usage_date=current_date and imports<v_limit
      returning imports into v_used;
  end if;
  if v_used is null then
    if p_kind='image_generations' then
      select image_generations into v_used from public.user_daily_usage where user_id=v_user and usage_date=current_date;
    else
      select imports into v_used from public.user_daily_usage where user_id=v_user and usage_date=current_date;
    end if;
    return query select false,v_used,v_limit,v_plan;
  else
    return query select true,v_used,v_limit,v_plan;
  end if;
end;
$$;
revoke all on function public.consume_daily_quota(text) from public;
grant execute on function public.consume_daily_quota(text) to authenticated;
