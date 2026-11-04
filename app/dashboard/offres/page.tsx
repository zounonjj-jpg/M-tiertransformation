"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessProfile = {
  profession: string;
  skills: string[] | null;
  target_audience: string | null;
  experience: string | null;
  business_stage: string | null;
};
type PriceTier = { name: string; price: string; detail: string };
type Offer = {
  id?: string;
  title: string;
  target_audience: string;
  customer_problem: string;
  promised_result: string;
  description: string;
  deliverables: string[];
  pricing: PriceTier[];
  status: "draft" | "ready" | "archived";
  created_at?: string;
};

const emptyOffer = (): Offer => ({
  title: "", target_audience: "", customer_problem: "", promised_result: "",
  description: "", deliverables: ["", "", ""],
  pricing: [
    { name: "Essentielle", price: "", detail: "La solution au besoin principal" },
    { name: "Standard", price: "", detail: "La solution complète avec accompagnement" },
    { name: "Premium", price: "", detail: "Une solution approfondie et personnalisée" },
  ],
  status: "draft",
});

function createOfferBase(profile: BusinessProfile): Offer {
  const profession = profile.profession.trim();
  const skill = profile.skills?.filter(Boolean)[0] || profession;
  const audience = profile.target_audience?.trim() || "les personnes et organisations qui ont besoin de votre expertise";
  return {
    ...emptyOffer(),
    title: `Offre ${profession} — solution principale`,
    target_audience: audience,
    customer_problem: `Votre clientèle a besoin d'une solution fiable dans le domaine de ${profession}, mais ne sait pas toujours comment choisir un professionnel ou obtenir le résultat attendu.`,
    promised_result: `Aider ${audience} à obtenir un résultat concret grâce à votre savoir-faire en ${skill}, avec un cadre, un délai et un suivi clairement définis.`,
    description: `Vous accompagnez le client depuis la compréhension de son besoin jusqu'à la livraison. Vous clarifiez les attentes, réalisez la prestation convenue et vérifiez que le résultat répond au besoin initial. Adaptez cette description à votre façon réelle de travailler.`,
    deliverables: [
      "Un échange initial pour préciser le besoin et les attentes",
      `Une prestation concrète mobilisant votre compétence en ${skill}`,
      "Une livraison dans le délai convenu et un point de suivi",
    ],
  };
}

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState<Offer>(emptyOffer());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase) { router.replace("/auth"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const [{ data: business, error: businessError }, { data: rows, error: offersError }] = await Promise.all([
      supabase.from("business_profiles").select("profession,skills,target_audience,experience,business_stage").eq("user_id", user.id).maybeSingle(),
      supabase.from("business_offers").select("id,title,target_audience,customer_problem,promised_result,description,deliverables,pricing,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (businessError) setError(businessError.message);
    if (offersError) setError(offersError.message);
    setProfile(business as BusinessProfile | null);
    setOffers((rows ?? []) as Offer[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  function update<K extends keyof Offer>(key: K, value: Offer[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function startNew() {
    setForm(profile ? createOfferBase(profile) : emptyOffer());
    setNotice(""); setError("");
  }

  function editOffer(offer: Offer) {
    setForm({
      ...offer,
      deliverables: Array.isArray(offer.deliverables) ? offer.deliverables : [],
      pricing: Array.isArray(offer.pricing) ? offer.pricing : [],
    });
    setNotice(""); setError("");
  }

  function generateBase() {
    if (!profile) return;
    setForm(current => ({ ...createOfferBase(profile), id: current.id, status: current.status }));
    setNotice("Une première proposition a été préparée à partir de votre profil. Relisez et personnalisez chaque champ avant de l'enregistrer.");
    setError("");
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(""); setError("");
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      target_audience: form.target_audience.trim(),
      customer_problem: form.customer_problem.trim(),
      promised_result: form.promised_result.trim(),
      description: form.description.trim(),
      deliverables: form.deliverables.map(x => x.trim()).filter(Boolean),
      pricing: form.pricing.filter(x => x.name.trim() || x.price.trim() || x.detail.trim()),
      status: form.status,
      updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const response = form.id
      ? await supabase.from("business_offers").update(payload).eq("id", form.id).eq("user_id", user.id).select("id,title,target_audience,customer_problem,promised_result,description,deliverables,pricing,status,created_at").single()
      : await supabase.from("business_offers").insert(payload).select("id,title,target_audience,customer_problem,promised_result,description,deliverables,pricing,status,created_at").single();
    if (response.error) setError(response.error.message);
    else {
      const saved = response.data as Offer;
      setForm(saved);
      setOffers(current => [saved, ...current.filter(item => item.id !== saved.id)]);
      setNotice("Votre offre a été enregistrée dans votre espace privé.");
    }
    setSaving(false);
  }

  async function removeOffer() {
    if (!supabase || !form.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    setDeleting(true); setError(""); setNotice("");
    const { error: deleteError } = await supabase.from("business_offers").delete().eq("id", form.id).eq("user_id", user.id);
    if (deleteError) setError(deleteError.message);
    else { setOffers(current => current.filter(item => item.id !== form.id)); setForm(emptyOffer()); setNotice("L'offre a été supprimée."); }
    setDeleting(false);
  }

  if (loading) return <main className="dashboard-loading">Chargement de vos offres…</main>;

  return <main className="workspace">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link>
      <div className="side-label">VOTRE ESPACE</div>
      <Link className="side-link" href="/dashboard">⌂ <span>Vue d'ensemble</span></Link>
      <Link className="side-link" href="/dashboard#profil">✳ <span>Mon profil métier</span></Link>
      <Link className="side-link" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link>
      <Link className="side-link selected" href="/dashboard/offres">◇ <span>Mes offres</span></Link><Link className="side-link" href="/dashboard/clients">◎ <span>Prospects & clients</span></Link><Link className="side-link" href="/dashboard/factory">✧ <span>Digital Factory</span></Link>
    </aside>
    <section className="workspace-main">
      <div className="workspace-top"><div><span className="eyebrow dark">BUSINESS ARCHITECT · ÉTAPE 03</span><h1>Construisez votre offre <span>✦</span></h1><p>Transformez votre expertise en une proposition claire que vos clients peuvent comprendre.</p></div><Link className="account-pill" href="/dashboard">← Tableau de bord</Link></div>
      {!profile ? <div className="analysis-empty"><h2>Commencez par votre profil métier</h2><p>Votre métier et vos compétences permettent de préparer une première structure d'offre.</p><Link className="button button-primary" href="/dashboard#profil">Compléter mon profil →</Link></div> : <>
        <div className="offer-toolbar"><div><b>{offers.length} offre{offers.length > 1 ? "s" : ""} enregistrée{offers.length > 1 ? "s" : ""}</b><span>Vos brouillons restent privés dans votre compte.</span></div><button className="button button-primary" type="button" onClick={startNew}>+ Nouvelle offre</button></div>
        <div className="offer-layout">
          <section className="offer-list"><h2>Mes offres</h2>{offers.length === 0 ? <p className="offer-empty">Aucune offre pour le moment. Préparez votre première proposition à droite.</p> : offers.map(offer => <button type="button" key={offer.id} className={form.id === offer.id ? "offer-list-item active" : "offer-list-item"} onClick={() => editOffer(offer)}><b>{offer.title}</b><span>{offer.status === "ready" ? "Prête" : offer.status === "archived" ? "Archivée" : "Brouillon"}</span></button>)}</section>
          <form className="offer-editor" onSubmit={saveOffer}>
            <div className="offer-editor-head"><div><span className="eyebrow dark">VOTRE PROPOSITION COMMERCIALE</span><h2>{form.id ? "Modifier votre offre" : "Nouvelle offre"}</h2></div><button type="button" className="offer-generate" onClick={generateBase}>✦ Préparer une base depuis mon métier</button></div>
            <label>Nom de l'offre<input required minLength={3} maxLength={140} value={form.title} onChange={e=>update("title",e.target.value)} placeholder="Ex. : Pack de création de site web"/></label>
            <label>À qui s'adresse cette offre ?<input value={form.target_audience} onChange={e=>update("target_audience",e.target.value)} placeholder="Ex. : petites entreprises, parents, commerçants…"/></label>
            <label>Quel problème du client résolvez-vous ?<textarea rows={3} value={form.customer_problem} onChange={e=>update("customer_problem",e.target.value)} placeholder="Décrivez le besoin concret de votre client."/></label>
            <label>Quel résultat promettez-vous ?<textarea rows={3} value={form.promised_result} onChange={e=>update("promised_result",e.target.value)} placeholder="Décrivez un résultat réaliste et vérifiable."/></label>
            <label>Description et méthode de travail<textarea rows={4} value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Expliquez comment vous accompagnez le client."/></label>
            <div className="offer-fieldset"><div><b>Ce que le client reçoit</b><span>Une ligne par élément livré.</span></div>{form.deliverables.map((item,index)=><input key={index} value={item} onChange={e=>update("deliverables",form.deliverables.map((x,i)=>i===index?e.target.value:x))} placeholder={`Livrable ${index+1}`}/>)}
              <button type="button" className="text-action" onClick={()=>update("deliverables",[...form.deliverables,""])}>+ Ajouter un livrable</button>
            </div>
            <div className="offer-fieldset"><div><b>Vos formules et vos prix</b><span>Indiquez vos montants et votre devise (FCFA, €, $, etc.).</span></div>{form.pricing.map((tier,index)=><div className="price-tier" key={index}><input aria-label={`Nom de la formule ${index+1}`} value={tier.name} onChange={e=>update("pricing",form.pricing.map((x,i)=>i===index?{...x,name:e.target.value}:x))} placeholder="Nom de la formule"/><input aria-label={`Prix de la formule ${index+1}`} value={tier.price} onChange={e=>update("pricing",form.pricing.map((x,i)=>i===index?{...x,price:e.target.value}:x))} placeholder="Prix et devise"/><input aria-label={`Détail de la formule ${index+1}`} value={tier.detail} onChange={e=>update("pricing",form.pricing.map((x,i)=>i===index?{...x,detail:e.target.value}:x))} placeholder="Ce qui est inclus"/></div>)}
              <button type="button" className="text-action" onClick={()=>update("pricing",[...form.pricing,{name:"",price:"",detail:""}])}>+ Ajouter une formule</button>
            </div>
            <label>État de l'offre<select value={form.status} onChange={e=>update("status",e.target.value as Offer["status"])}><option value="draft">Brouillon</option><option value="ready">Prête à présenter</option><option value="archived">Archivée</option></select></label>
            {error && <p className="form-alert error">{error}</p>}{notice && <p className="form-alert success">{notice}</p>}
            <div className="offer-actions"><button className="button button-primary" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mon offre →"}</button>{form.id && <button type="button" className="offer-delete" disabled={deleting} onClick={removeOffer}>{deleting ? "Suppression…" : "Supprimer cette offre"}</button>}</div>
            <p className="offer-note">La préparation automatique fournit une base de travail, pas une étude de marché ni une validation de vos tarifs. Vérifiez vos promesses, vos coûts et la demande avant de vendre.</p>
          </form>
        </div>
      </>}
    </section>
  </main>;
}
