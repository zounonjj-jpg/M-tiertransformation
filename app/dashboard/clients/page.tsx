"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";
type Lead = {
  id?: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  need: string;
  source: string;
  status: LeadStatus;
  estimated_value: number | null;
  currency: string;
  next_follow_up_at: string | null;
  notes: string;
  created_at?: string;
};
const emptyLead = (): Lead => ({
  contact_name: "", company_name: "", email: "", phone: "", need: "",
  source: "Ajout manuel", status: "new", estimated_value: null,
  currency: "FCFA", next_follow_up_at: null, notes: "",
});
const statusLabels: Record<LeadStatus,string> = {
  new: "Nouveau", contacted: "Contacté", proposal: "Offre envoyée", won: "Client gagné", lost: "Non conclu",
};

export default function ClientsPage() {
  const router = useRouter();
  const [loading,setLoading] = useState(true);
  const [leads,setLeads] = useState<Lead[]>([]);
  const [form,setForm] = useState<Lead>(emptyLead());
  const [search,setSearch] = useState("");
  const [saving,setSaving] = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase) { router.replace("/auth"); return; }
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const {data,error:loadError} = await supabase.from("business_leads")
      .select("id,contact_name,company_name,email,phone,need,source,status,estimated_value,currency,next_follow_up_at,notes,created_at")
      .eq("user_id",user.id).order("created_at",{ascending:false});
    if (loadError) setError(loadError.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  },[router]);

  useEffect(()=>{void load();},[load]);

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return leads;
    return leads.filter(item=>[item.contact_name,item.company_name,item.email,item.phone,item.need,statusLabels[item.status]].some(v=>(v??"").toLowerCase().includes(q)));
  },[leads,search]);

  const counts = useMemo(()=>({
    total:leads.length,
    active:leads.filter(x=>["new","contacted","proposal"].includes(x.status)).length,
    won:leads.filter(x=>x.status==="won").length,
    followups:leads.filter(x=>x.next_follow_up_at && x.next_follow_up_at <= new Date().toISOString().slice(0,10) && !["won","lost"].includes(x.status)).length,
  }),[leads]);

  function update<K extends keyof Lead>(key:K,value:Lead[K]) {
    setForm(current=>({...current,[key]:value}));
  }
  function startNew() { setForm(emptyLead());setNotice("");setError(""); }
  function edit(item:Lead) { setForm({...item});setNotice("");setError(""); }

  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setNotice("");
    if(!supabase)return;
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/auth");return;}
    const amount=form.estimated_value;
    if(amount!==null && (!Number.isFinite(amount)||amount<0)){setError("Le montant estimé doit être un nombre positif.");return;}
    const payload={
      user_id:user.id,
      contact_name:form.contact_name.trim(),
      company_name:form.company_name.trim(),
      email:form.email.trim(),
      phone:form.phone.trim(),
      need:form.need.trim(),
      source:form.source.trim()||"Ajout manuel",
      status:form.status,
      estimated_value:amount,
      currency:form.currency.trim(),
      next_follow_up_at:form.next_follow_up_at||null,
      notes:form.notes.trim(),
      updated_at:new Date().toISOString(),
    };
    setSaving(true);
    if(form.id){
      const {data,error:saveError}=await supabase.from("business_leads").update(payload).eq("id",form.id).eq("user_id",user.id)
        .select("id,contact_name,company_name,email,phone,need,source,status,estimated_value,currency,next_follow_up_at,notes,created_at").single();
      if(saveError)setError(saveError.message);
      else{const saved=data as Lead;setLeads(current=>current.map(x=>x.id===saved.id?saved:x));setForm(saved);setNotice("Fiche mise à jour.");}
    }else{
      const {data,error:saveError}=await supabase.from("business_leads").insert(payload)
        .select("id,contact_name,company_name,email,phone,need,source,status,estimated_value,currency,next_follow_up_at,notes,created_at").single();
      if(saveError)setError(saveError.message);
      else{const saved=data as Lead;setLeads(current=>[saved,...current]);setForm(saved);setNotice("Prospect ajouté à votre suivi commercial.");}
    }
    setSaving(false);
  }

  async function remove() {
    if(!supabase||!form.id)return;
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/auth");return;}
    setDeleting(true);setError("");setNotice("");
    const {error:deleteError}=await supabase.from("business_leads").delete().eq("id",form.id).eq("user_id",user.id);
    if(deleteError)setError(deleteError.message);
    else{setLeads(current=>current.filter(x=>x.id!==form.id));setForm(emptyLead());setNotice("Fiche supprimée.");}
    setDeleting(false);
  }

  if(loading)return <main className="dashboard-loading">Chargement de votre suivi commercial…</main>;
  return <main className="workspace">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link>
      <div className="side-label">VOTRE ESPACE</div>
      <Link className="side-link" href="/dashboard">⌂ <span>Vue d'ensemble</span></Link>
      <Link className="side-link" href="/dashboard#profil">✳ <span>Mon profil métier</span></Link>
      <Link className="side-link" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link>
      <Link className="side-link" href="/dashboard/offres">◇ <span>Mes offres</span></Link>
      <Link className="side-link selected" href="/dashboard/clients">◎ <span>Prospects & clients</span></Link><Link className="side-link" href="/dashboard/factory">✧ <span>Digital Factory</span></Link>
    </aside>
    <section className="workspace-main">
      <div className="workspace-top"><div><span className="eyebrow dark">MARKETING & SALES · ÉTAPE 04</span><h1>Votre suivi commercial <span>✦</span></h1><p>Centralisez vos contacts et gardez une trace de chaque opportunité.</p></div><Link className="account-pill" href="/dashboard">← Tableau de bord</Link></div>
      <div className="workspace-stats crm-stats">
        <article><small>CONTACTS SUIVIS</small><b>{counts.total}</b><span>Dans votre espace privé</span></article>
        <article><small>OPPORTUNITÉS EN COURS</small><b>{counts.active}</b><span>Nouveaux, contactés ou offre envoyée</span></article>
        <article><small>CLIENTS GAGNÉS</small><b>{counts.won}</b><span>Affaires conclues</span></article>
      </div>
      {counts.followups>0&&<p className="crm-reminder">⏰ Vous avez {counts.followups} relance{counts.followups>1?"s":""} à effectuer aujourd'hui ou en retard.</p>}
      <div className="crm-layout">
        <section className="crm-list">
          <div className="crm-list-head"><h2>Contacts</h2><button type="button" className="button button-primary" onClick={startNew}>+ Ajouter</button></div>
          <input className="crm-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un nom, une entreprise…"/>
          {filtered.length===0?<p className="offer-empty">{leads.length===0?"Aucun contact enregistré. Ajoutez votre premier prospect.":"Aucun résultat pour cette recherche."}</p>:filtered.map(item=><button type="button" key={item.id} className={form.id===item.id?"crm-contact active":"crm-contact"} onClick={()=>edit(item)}>
            <span className="crm-contact-top"><b>{item.contact_name}</b><small className={`crm-status status-${item.status}`}>{statusLabels[item.status]}</small></span>
            <span>{item.company_name||item.email||item.phone||"Contact personnel"}</span>
            {item.next_follow_up_at&&<small>Relance : {item.next_follow_up_at}</small>}
          </button>)}
        </section>
        <form className="crm-editor" onSubmit={save}>
          <div className="offer-editor-head"><div><span className="eyebrow dark">FICHE CONTACT</span><h2>{form.id?"Modifier le contact":"Nouveau prospect / client"}</h2></div></div>
          <label>Nom du contact<input required minLength={2} maxLength={120} value={form.contact_name} onChange={e=>update("contact_name",e.target.value)} placeholder="Nom et prénom"/></label>
          <div className="crm-two"><label>Entreprise<input value={form.company_name} onChange={e=>update("company_name",e.target.value)} placeholder="Nom de l'entreprise"/></label><label>Source<input value={form.source} onChange={e=>update("source",e.target.value)} placeholder="Ex. : recommandation, Instagram…"/></label></div>
          <div className="crm-two"><label>E-mail<input type="email" value={form.email} onChange={e=>update("email",e.target.value)} placeholder="contact@exemple.com"/></label><label>Téléphone<input type="tel" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="+229…"/></label></div>
          <label>Besoin exprimé<textarea rows={3} value={form.need} onChange={e=>update("need",e.target.value)} placeholder="Quel problème cette personne souhaite-t-elle résoudre ?"/></label>
          <div className="crm-two"><label>Étape commerciale<select value={form.status} onChange={e=>update("status",e.target.value as LeadStatus)}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Date de prochaine relance<input type="date" value={form.next_follow_up_at??""} onChange={e=>update("next_follow_up_at",e.target.value||null)}/></label></div>
          <div className="crm-two"><label>Valeur estimée<input type="number" min="0" step="0.01" value={form.estimated_value??""} onChange={e=>update("estimated_value",e.target.value===""?null:Number(e.target.value))} placeholder="0"/></label><label>Devise<input value={form.currency} onChange={e=>update("currency",e.target.value)} placeholder="FCFA, EUR, USD…"/></label></div>
          <label>Notes privées<textarea rows={3} value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Dernier échange, prochaine action, préférences…"/></label>
          {error&&<p className="form-alert error">{error}</p>}{notice&&<p className="form-alert success">{notice}</p>}
          <div className="offer-actions"><button className="button button-primary" disabled={saving}>{saving?"Enregistrement…":"Enregistrer le contact →"}</button>{form.id&&<button type="button" className="offer-delete" disabled={deleting} onClick={remove}>{deleting?"Suppression…":"Supprimer"}</button>}</div>
          <p className="offer-note">Utilisez ces informations uniquement pour votre suivi professionnel et respectez les règles applicables à la protection des données et à la prospection dans votre pays.</p>
        </form>
      </div>
    </section>
  </main>;
}
