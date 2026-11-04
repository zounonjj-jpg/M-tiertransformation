"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = { profession: string; skills: string[]; experience: string | null; target_audience: string | null; main_goal: string | null; business_stage: string | null };
type Profile = { full_name: string | null; role: string; country: string | null };

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [profession, setProfession] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("Débutant");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("Gagner mes premiers clients");
  const [stage, setStage] = useState("Je démarre");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) { router.replace("/auth"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      if (!alive) return;
      setEmail(user.email ?? "");
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("full_name,role,country").eq("id", user.id).maybeSingle(),
        supabase.from("business_profiles").select("profession,skills,experience,target_audience,main_goal,business_stage").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!alive) return;
      setProfile(p as Profile | null);
      if (b) {
        const row = b as Business;
        setBusiness(row); setProfession(row.profession); setSkills((row.skills ?? []).join(", "));
        setExperience(row.experience ?? "Débutant"); setAudience(row.target_audience ?? "");
        setGoal(row.main_goal ?? "Gagner mes premiers clients"); setStage(row.business_stage ?? "Je démarre");
      }
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [router]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice("");
    if (!supabase) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const payload = {
      user_id: user.id, profession: profession.trim(),
      skills: skills.split(",").map(s=>s.trim()).filter(Boolean),
      experience, target_audience: audience.trim(), main_goal: goal, business_stage: stage,
      updated_at: new Date().toISOString(),
    };
    const { error: saveError } = await supabase.from("business_profiles").upsert(payload, { onConflict: "user_id" });
    if (saveError) setError(saveError.message);
    else { setBusiness(payload); setNotice("Votre profil métier a bien été enregistré. Votre espace est prêt pour la prochaine étape."); }
    setSaving(false);
  }

  async function signOut() { await supabase?.auth.signOut(); router.push("/"); }

  if (loading) return <main className="dashboard-loading">Préparation de votre espace NEXBIZ AI…</main>;
  const name = profile?.full_name?.split(" ")[0] || email.split("@")[0] || "Entrepreneur";
  return <main className="workspace">
    <aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link><div className="side-label">VOTRE ESPACE</div><a className="side-link selected" href="#overview">⌂ <span>Vue d'ensemble</span></a><a className="side-link" href="#profil">✳ <span>Mon profil métier</span></a><Link className="side-link" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link><div className="sidebar-bottom"><div className="user-mini"><div className="user-avatar">{name.slice(0,1).toUpperCase()}</div><div><b>{name}</b><small>{email}</small></div></div><button onClick={signOut} className="logout">Déconnexion ↗</button></div></aside>
    <section className="workspace-main" id="overview">
      <div className="workspace-top"><div><span className="eyebrow dark">VOTRE CENTRE DE PILOTAGE</span><h1>Bonjour {name} <span>✦</span></h1><p>Chaque grande activité commence par une première étape.</p></div><span className="account-pill">● Espace personnel</span></div>
      <div className="welcome-panel"><div><span className="welcome-kicker">VOTRE PARCOURS NEXBIZ</span><h2>Transformez votre savoir-faire<br/>en une activité qui vous ressemble.</h2><p>Complétez votre profil métier pour préparer une analyse adaptée à votre expérience et à vos ambitions.</p><a href="#profil" className="welcome-action">Compléter mon profil <b>→</b></a></div><div className="welcome-symbol">N<span>✳</span></div></div>
      <div className="workspace-stats"><article><small>PROFIL MÉTIER</small><b>{business ? "Enregistré" : "À compléter"}</b><span>{business ? "Vos informations sont sauvegardées" : "Votre première étape"}</span></article><article><small>PROCHAINE ÉTAPE</small><b>Diagnostic business</b><span><Link href="/dashboard/analyse">Construire ma stratégie →</Link></span></article><article><small>VOTRE FORMULE</small><b>Découverte</b><span>Accès initial</span></article></div>
      <section className="profile-panel" id="profil"><div className="panel-heading"><div><span className="eyebrow dark">ÉTAPE 01 · APPRENDRE À VOUS CONNAÎTRE</span><h2>Votre profil métier</h2><p>Parlez-nous de ce que vous savez faire. Vous pourrez modifier ces informations plus tard.</p></div><span className="step-count">01 / 04</span></div>
        <form className="business-form" onSubmit={save}>
          <label>Quel est votre métier ou votre activité ?<input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Ex. : couturier, enseignant, développeur, commerçant…" required/></label>
          <label>Quelles sont vos compétences ?<textarea value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Séparez vos compétences par des virgules. Ex. : couture, vente, design…" rows={3}/><small>Plusieurs compétences ? Séparez-les par des virgules.</small></label>
          <div className="form-two"><label>Votre expérience<select value={experience} onChange={e=>setExperience(e.target.value)}><option>Débutant</option><option>Moins de 2 ans</option><option>2 à 5 ans</option><option>Plus de 5 ans</option><option>Expert</option></select></label><label>Où en êtes-vous ?<select value={stage} onChange={e=>setStage(e.target.value)}><option>Je démarre</option><option>J'ai une activité mais peu de clients</option><option>J'ai déjà des clients</option><option>Je veux développer mon activité</option></select></label></div>
          <label>À qui souhaitez-vous proposer vos services ou produits ?<input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Ex. : particuliers, entreprises, étudiants…"/></label>
          <label>Votre objectif prioritaire<select value={goal} onChange={e=>setGoal(e.target.value)}><option>Gagner mes premiers clients</option><option>Créer une nouvelle source de revenus</option><option>Vendre mes produits ou services en ligne</option><option>Développer mon activité existante</option><option>Créer une entreprise</option></select></label>
          {error && <p className="form-alert error">{error}</p>}{notice && <p className="form-alert success">{notice}</p>}
          <button className="button button-primary" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mon profil →"}</button>
        </form>
      </section>
      <p className="workspace-footer">NEXBIZ AI · Vos compétences sont votre point de départ.</p>
    </section>
  </main>;
}
