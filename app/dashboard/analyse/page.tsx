"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = {
  profession: string;
  skills: string[] | null;
  experience: string | null;
  target_audience: string | null;
  main_goal: string | null;
  business_stage: string | null;
};
type Opportunity = { title: string; description: string };
type PlanStep = { period: string; actions: string[] };
type AnalysisResult = {
  positioning: string;
  strengths: string[];
  opportunities: Opportunity[];
  offer: { name: string; description: string; deliverables: string[] };
  pricing: string[];
  marketing: string[];
  plan: PlanStep[];
  nextStep: string;
};

function buildDiagnostic(b: Business): AnalysisResult {
  const profession = b.profession.trim();
  const skills = (b.skills ?? []).filter(Boolean);
  const audience = b.target_audience?.trim() || "les particuliers et les organisations qui ont besoin de cette expertise";
  const skillText = skills.length ? skills.join(", ") : profession;
  const level = b.experience || "votre expérience actuelle";
  const goal = b.main_goal || "développer votre activité";
  const stage = b.business_stage || "votre situation actuelle";
  const firstSkill = skills[0] || profession;

  return {
    positioning: `Vous accompagnez ${audience} grâce à votre expertise en ${profession}. Votre différence doit être la clarté du résultat que vous apportez, la qualité de votre travail et une expérience client fiable. Avec ${level.toLowerCase()} et vos compétences (${skillText}), commencez par une offre simple, facile à expliquer et à livrer.`,
    strengths: [
      `Une expertise identifiable autour de « ${profession} ».`,
      skills.length ? `Plusieurs compétences mobilisables : ${skills.slice(0, 5).join(", ")}.` : "Une base métier à préciser en listant vos compétences concrètes.",
      `Un objectif clair : ${goal.toLowerCase()}.`,
      `Votre point de départ est connu : ${stage.toLowerCase()}.`,
    ],
    opportunities: [
      { title: "Une prestation principale", description: `Proposez un service précis lié à ${firstSkill}, avec un résultat concret, un délai annoncé et un périmètre bien défini.` },
      { title: "Une offre en plusieurs niveaux", description: "Créez une formule essentielle, une formule standard et une formule premium afin de répondre à différents budgets sans dévaloriser votre travail." },
      { title: "Un produit réutilisable", description: `Transformez une partie de votre savoir-faire en guide, modèle, formation courte ou ressource pratique autour de ${profession}.` },
    ],
    offer: {
      name: `Pack de lancement — ${profession}`,
      description: `Une solution claire destinée à ${audience}, qui répond à un besoin précis grâce à ${skillText}. Présentez le bénéfice attendu avant de détailler votre méthode.`,
      deliverables: ["Un échange de cadrage pour comprendre le besoin", "Une prestation ou ressource clairement définie", "Un délai et des conditions annoncés à l’avance", "Un suivi après livraison pour recueillir le retour du client"],
    },
    pricing: [
      "Formule Essentielle : une réponse au besoin principal, avec un périmètre limité.",
      "Formule Standard : la prestation complète, avec accompagnement ou options utiles.",
      "Formule Premium : une solution plus personnalisée, prioritaire ou approfondie.",
      "Avant de fixer les montants, calculez vos coûts, le temps nécessaire, le pouvoir d’achat du marché visé et la valeur du résultat. Testez vos prix auprès de vrais prospects.",
    ],
    marketing: [
      `Publiez des exemples concrets de votre travail en expliquant le problème résolu pour ${audience}.`,
      "Demandez des témoignages et l’autorisation de présenter vos réalisations.",
      "Préparez une courte présentation de votre offre : problème, résultat, méthode, délai et moyen de contact.",
      "Contactez chaque semaine des prospects ciblés avec un message personnalisé, sans envoi massif non sollicité.",
    ],
    plan: [
      { period: "Jours 1 à 7 · Clarifier", actions: ["Choisir un problème client précis", "Définir le résultat promis et les limites de la prestation", "Interroger au moins cinq personnes correspondant à votre clientèle cible"] },
      { period: "Jours 8 à 14 · Construire", actions: ["Rédiger les trois formules de votre offre", "Préparer un exemple ou une démonstration", "Créer une présentation simple avec vos coordonnées"] },
      { period: "Jours 15 à 21 · Trouver des clients", actions: ["Établir une liste de prospects pertinents", "Envoyer des propositions personnalisées", "Noter les questions et objections reçues"] },
      { period: "Jours 22 à 30 · Améliorer", actions: ["Analyser les retours et les demandes", "Ajuster l’offre ou le prix si nécessaire", "Demander un témoignage à chaque client satisfait"] },
    ],
    nextStep: `Validez d’abord le besoin auprès de quelques personnes de votre marché. Votre objectif actuel — ${goal.toLowerCase()} — doit guider les premières actions, plutôt que de construire trop d’outils avant d’avoir confirmé la demande.`,
  };
}

export default function AnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) { router.replace("/auth"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      const [{ data: profile, error: profileError }, { data: previous }] = await Promise.all([
        supabase.from("business_profiles").select("profession,skills,experience,target_audience,main_goal,business_stage").eq("user_id", user.id).maybeSingle(),
        supabase.from("business_analyses").select("result").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      if (profileError) setError(profileError.message);
      if (profile) setBusiness(profile as Business);
      if (previous?.result) setResult(previous.result as AnalysisResult);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [router]);

  async function generate() {
    setError(""); setMessage("");
    if (!supabase || !business) return;
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGenerating(false); router.replace("/auth"); return; }
    const diagnostic = buildDiagnostic(business);
    const { error: saveError } = await supabase.from("business_analyses").insert({
      user_id: user.id,
      input_snapshot: business,
      result: diagnostic,
    });
    if (saveError) setError(saveError.message);
    else { setResult(diagnostic); setMessage("Votre diagnostic a été généré et sauvegardé dans votre espace."); }
    setGenerating(false);
  }

  if (loading) return <main className="dashboard-loading">Préparation de votre diagnostic…</main>;

  return <main className="workspace">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link>
      <div className="side-label">VOTRE ESPACE</div>
      <Link className="side-link" href="/dashboard">⌂ <span>Vue d'ensemble</span></Link>
      <Link className="side-link" href="/dashboard#profil">✳ <span>Mon profil métier</span></Link>
      <Link className="side-link selected" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link><Link className="side-link" href="/dashboard/offres">◇ <span>Mes offres</span></Link><Link className="side-link" href="/dashboard/clients">◎ <span>Prospects & clients</span></Link><Link className="side-link" href="/dashboard/factory">✧ <span>Digital Factory</span></Link>
    </aside>
    <section className="workspace-main">
      <div className="workspace-top"><div><span className="eyebrow dark">INTELLIGENCE MÉTIER · ÉTAPE 02</span><h1>Votre diagnostic business <span>✦</span></h1><p>Un premier plan structuré à partir de votre profil et de vos objectifs.</p></div><Link className="account-pill" href="/dashboard">← Retour au tableau de bord</Link></div>
      {!business ? <div className="analysis-empty"><h2>Votre profil métier est nécessaire</h2><p>Complétez d’abord votre métier et vos compétences pour obtenir un diagnostic pertinent.</p><Link className="button button-primary" href="/dashboard#profil">Compléter mon profil →</Link></div> : <>
        <div className="analysis-intro"><span className="welcome-kicker">VOTRE ACTIVITÉ · {business.profession}</span><h2>De votre savoir-faire à une offre concrète.</h2><p>Ce diagnostic initial vous aide à structurer vos premières décisions. Il s’appuie sur les informations que vous avez fournies et ne remplace pas une étude réelle de votre marché.</p><button className="button button-primary" onClick={generate} disabled={generating}>{generating ? "Préparation du diagnostic…" : result ? "Actualiser mon diagnostic →" : "Générer mon diagnostic →"}</button></div>
        {error && <p className="form-alert error">{error}</p>}{message && <p className="form-alert success">{message}</p>}
        <p className="analysis-disclaimer">Version initiale : diagnostic stratégique guidé, sans appel à un service d’IA payant. Les recommandations doivent être validées auprès de vrais clients.</p>
        {result && <div className="analysis-results">
          <article className="analysis-card analysis-wide"><span className="eyebrow dark">01 · POSITIONNEMENT</span><h2>Comment vous présenter</h2><p>{result.positioning}</p></article>
          <article className="analysis-card"><span className="eyebrow dark">02 · VOS ATOUTS</span><h2>Vos points de départ</h2><ul>{result.strengths.map((item,i)=><li key={i}>{item}</li>)}</ul></article>
          <article className="analysis-card"><span className="eyebrow dark">03 · OPPORTUNITÉS</span><h2>Trois pistes à explorer</h2>{result.opportunities.map((item,i)=><div className="analysis-item" key={i}><b>{item.title}</b><p>{item.description}</p></div>)}</article>
          <article className="analysis-card analysis-wide"><span className="eyebrow dark">04 · VOTRE PREMIÈRE OFFRE</span><h2>{result.offer.name}</h2><p>{result.offer.description}</p><ul>{result.offer.deliverables.map((item,i)=><li key={i}>{item}</li>)}</ul></article>
          <article className="analysis-card"><span className="eyebrow dark">05 · STRATÉGIE DE PRIX</span><h2>Construire vos tarifs</h2><ul>{result.pricing.map((item,i)=><li key={i}>{item}</li>)}</ul></article>
          <article className="analysis-card"><span className="eyebrow dark">06 · MARKETING</span><h2>Vous faire connaître</h2><ul>{result.marketing.map((item,i)=><li key={i}>{item}</li>)}</ul></article>
          <article className="analysis-card analysis-wide"><span className="eyebrow dark">07 · PLAN D’ACTION SUR 30 JOURS</span><h2>Passer de l’idée à l’action</h2><div className="analysis-plan">{result.plan.map((step,i)=><div key={i}><b>{step.period}</b><ul>{step.actions.map((action,j)=><li key={j}>{action}</li>)}</ul></div>)}</div></article>
          <article className="analysis-card analysis-wide analysis-next"><span className="eyebrow dark">VOTRE PROCHAINE ACTION</span><p>{result.nextStep}</p></article>
        </div>}
      </>}
    </section>
  </main>;
}
