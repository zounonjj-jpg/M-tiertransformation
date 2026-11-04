"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProjectType = "website" | "catalogue" | "ebook" | "course" | "mobile_app";
type Section = { title: string; purpose: string; actions: string[] };
type Blueprint = { positioning: string; promise: string; sections: Section[]; launch_steps: string[]; checklist: string[] };
type Project = { id: string; title: string; description: string | null; project_type: ProjectType; target_audience: string; goal: string; blueprint: Blueprint; status: string; price: number | null; currency: string; created_at: string };
type Profile = { profession: string; skills: string[] | null; target_audience: string | null };

const types: { value: ProjectType; label: string; description: string }[] = [
  { value: "website", label: "Site web", description: "Présenter votre activité et convertir des visiteurs en demandes." },
  { value: "catalogue", label: "Catalogue numérique", description: "Organiser vos produits, services et tarifs." },
  { value: "ebook", label: "E-book / guide", description: "Transformer votre expertise en contenu structuré." },
  { value: "course", label: "Formation en ligne", description: "Construire un parcours pédagogique progressif." },
  { value: "mobile_app", label: "Application mobile", description: "Définir les écrans et fonctions d'une première version." },
];

function buildBlueprint(type: ProjectType, title: string, audience: string, goal: string, profession: string, details: string): Blueprint {
  const shared = [
    { title: "Comprendre le besoin", purpose: "Décrire le problème concret de la clientèle et les conséquences si rien ne change.", actions: ["Décrire la situation du public cible", "Identifier ses questions et objections", "Confirmer le besoin par des échanges réels"] },
    { title: "Présenter la solution", purpose: "Expliquer clairement ce que vous proposez, à qui cela s'adresse et ce que cela apporte.", actions: ["Présenter la méthode ou le produit", "Montrer les bénéfices sans promesse exagérée", "Préciser les limites et conditions"] },
    { title: "Faire passer à l'action", purpose: "Permettre à la personne intéressée de savoir exactement quelle est la prochaine étape.", actions: ["Afficher un appel à l'action clair", "Indiquer un moyen de contact", "Expliquer les prochaines étapes"] },
  ];
  const templates: Record<ProjectType, Section[]> = {
    website: [
      { title: "Accueil", purpose: "Faire comprendre en quelques secondes qui vous aidez et comment.", actions: ["Titre orienté résultat", "Présentation courte de votre activité", "Bouton de contact visible"] },
      { title: "Services ou produits", purpose: "Présenter les solutions avec leurs livrables et conditions.", actions: ["Décrire chaque offre", "Préciser les tarifs ou demander un devis", "Répondre aux questions fréquentes"] },
      { title: "À propos et preuves", purpose: "Installer la confiance avec des informations vérifiables.", actions: ["Présenter votre parcours", "Ajouter des réalisations autorisées", "Publier des témoignages authentiques"] },
      ...shared,
    ],
    catalogue: [
      { title: "Couverture et présentation", purpose: "Identifier la marque, le catalogue et la clientèle visée.", actions: ["Ajouter logo et coordonnées", "Présenter les catégories", "Expliquer comment commander"] },
      { title: "Fiches produits / services", purpose: "Aider à comparer et choisir.", actions: ["Nom et description", "Photos réelles et caractéristiques", "Prix, options et disponibilité"] },
      ...shared,
    ],
    ebook: [
      { title: "Introduction", purpose: "Présenter le problème, le lecteur visé et le résultat réaliste du guide.", actions: ["Définir le lecteur", "Expliquer ce qu'il va apprendre", "Donner les limites du contenu"] },
      { title: "Fondations", purpose: "Expliquer les notions indispensables avant la mise en pratique.", actions: ["Définir les termes importants", "Présenter les erreurs fréquentes", "Illustrer avec des exemples"] },
      { title: "Méthode pas à pas", purpose: "Guider le lecteur vers une application concrète.", actions: ["Découper la méthode en étapes", "Ajouter exercices et exemples", "Fournir une checklist"] },
      { title: "Conclusion et ressources", purpose: "Aider le lecteur à poursuivre après la lecture.", actions: ["Résumer les acquis", "Proposer un plan d'action", "Ajouter vos coordonnées et ressources"] },
    ],
    course: [
      { title: "Objectifs pédagogiques", purpose: "Définir ce que l'apprenant saura faire à la fin.", actions: ["Formuler des objectifs mesurables", "Préciser le niveau requis", "Définir les prérequis"] },
      { title: "Modules progressifs", purpose: "Faire évoluer l'apprenant des bases vers la pratique.", actions: ["Organiser les leçons", "Prévoir démonstrations et supports", "Ajouter exercices après chaque module"] },
      { title: "Évaluation et validation", purpose: "Vérifier les acquis et orienter la suite.", actions: ["Créer un exercice final", "Définir des critères de réussite", "Proposer une suite ou un accompagnement"] },
    ],
    mobile_app: [
      { title: "Utilisateurs et problème", purpose: "Définir les personnes qui utiliseront l'application et le problème prioritaire.", actions: ["Décrire les utilisateurs", "Lister leurs tâches principales", "Choisir un seul problème prioritaire pour le MVP"] },
      { title: "Écrans essentiels", purpose: "Décrire le parcours de la première ouverture à l'action principale.", actions: ["Accueil et navigation", "Inscription et profil si nécessaires", "Écran de la fonction centrale"] },
      { title: "Fonctionnalités et données", purpose: "Préciser ce que l'application doit faire et les informations à protéger.", actions: ["Classer fonctions indispensables et secondaires", "Définir les données à enregistrer", "Prévoir sécurité et gestion des erreurs"] },
      { title: "Test et lancement", purpose: "Valider une petite version avant d'élargir le produit.", actions: ["Tester avec quelques utilisateurs", "Corriger les blocages", "Mesurer l'usage réel"] },
    ],
  };
  const label = types.find(item => item.value === type)?.label ?? "Projet";
  return {
    positioning: `${title} est un projet de type ${label}, destiné à ${audience}. Il s'appuie sur l'expertise de ${profession || "votre activité"} et vise à ${goal.toLowerCase()}.`,
    promise: `Aider ${audience} à avancer sur le besoin suivant : ${goal}. La promesse finale devra être vérifiée et formulée sans garantie irréaliste.`,
    sections: templates[type],
    launch_steps: ["Valider le problème et la demande auprès de personnes de votre public cible.", "Préparer une première version limitée au besoin prioritaire.", "Faire tester la version par 3 à 5 personnes et recueillir leurs retours.", "Corriger les points bloquants, fixer les conditions et préparer la présentation.", "Lancer progressivement et suivre les demandes, ventes et retours."],
    checklist: [`Public cible défini : ${audience}`, "Problème confirmé par des échanges réels", "Contenu, prix et conditions vérifiés", "Coordonnées et appel à l'action testés", "Droits sur les textes, images et témoignages vérifiés", details.trim() ? `Informations complémentaires : ${details.trim()}` : "Contenu adapté à votre expérience réelle"],
  };
}

export default function FactoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profession, setProfession] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProjectType>("website");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase) { router.replace("/auth"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth"); return; }
    const [{ data: profile }, { data: rows, error: loadError }] = await Promise.all([
      supabase.from("business_profiles").select("profession,skills,target_audience").eq("user_id", user.id).maybeSingle(),
      supabase.from("business_projects").select("id,title,description,project_type,target_audience,goal,blueprint,status,price,currency,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (profile) {
      const p = profile as Profile;
      setProfession(p.profession);
      setAudience(p.target_audience || "");
      setTitle(p.profession ? `Projet ${p.profession}` : "");
    }
    if (loadError) setError(loadError.message);
    setProjects((rows ?? []) as Project[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!title.trim() || !audience.trim() || !goal.trim()) {
      setError("Renseignez le nom, le public cible et l'objectif du projet.");
      return;
    }
    setBlueprint(buildBlueprint(type, title.trim(), audience.trim(), goal.trim(), profession, details));
  }

  async function saveProject() {
    if (!supabase || !blueprint) return;
    setSaving(true); setError(""); setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); router.replace("/auth"); return; }
    const { data, error: saveError } = await supabase.from("business_projects").insert({
      user_id: user.id, title: title.trim(), description: blueprint.positioning,
      project_type: type, target_audience: audience.trim(), goal: goal.trim(),
      blueprint, status: "draft", currency: "EUR",
    }).select("id,title,description,project_type,target_audience,goal,blueprint,status,price,currency,created_at").single();
    if (saveError) setError(saveError.message);
    else {
      setProjects(current => [data as Project, ...current]);
      setNotice("Votre dossier de projet a été enregistré dans votre espace.");
    }
    setSaving(false);
  }

  if (loading) return <main className="dashboard-loading">Préparation de votre Digital Factory…</main>;

  return <main className="workspace">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link>
      <div className="side-label">VOTRE ESPACE</div>
      <Link className="side-link" href="/dashboard">⌂ <span>Vue d'ensemble</span></Link>
      <Link className="side-link" href="/dashboard#profil">✳ <span>Mon profil métier</span></Link>
      <Link className="side-link" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link>
      <Link className="side-link" href="/dashboard/offres">◇ <span>Mes offres</span></Link>
      <Link className="side-link" href="/dashboard/clients">◎ <span>Prospects & clients</span></Link>
      <Link className="side-link selected" href="/dashboard/factory">✧ <span>Digital Factory</span></Link>
    </aside>
    <section className="workspace-main">
      <div className="workspace-top"><div><span className="eyebrow dark">DIGITAL FACTORY · ÉTAPE 04</span><h1>Construisez votre produit <span>✦</span></h1><p>Transformez une idée ou une compétence en un projet numérique structuré.</p></div><Link className="account-pill" href="/dashboard">← Tableau de bord</Link></div>
      <div className="analysis-intro"><span className="welcome-kicker">DE L'IDÉE AU PROJET</span><h2>Choisissez ce que vous voulez créer.</h2><p>Préparez le plan de votre site web, catalogue, e-book, formation ou application. Cette première version crée un cahier de projet exploitable ; elle ne publie pas encore automatiquement le produit.</p></div>
      <div className="factory-layout">
        <form className="factory-form" onSubmit={generate}>
          <h2>Nouveau projet</h2>
          <label>Type de produit<select value={type} onChange={e=>setType(e.target.value as ProjectType)}>{types.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <p className="factory-type-help">{types.find(item=>item.value===type)?.description}</p>
          <label>Nom du projet<input required maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex. : Mon école de formation en ligne"/></label>
          <label>Public cible<input required maxLength={240} value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Ex. : jeunes entrepreneurs, parents, PME…"/></label>
          <label>Objectif principal<textarea required rows={3} maxLength={800} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Quel problème ce produit doit-il résoudre ?"/></label>
          <label>Précisions utiles (facultatif)<textarea rows={3} maxLength={1200} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Fonctions, chapitres, produits, contraintes, style…"/></label>
          {error&&<p className="form-alert error">{error}</p>}{notice&&<p className="form-alert success">{notice}</p>}
          <button className="button button-primary">Préparer le cahier de projet →</button>
        </form>
        <section className="factory-preview">
          {!blueprint ? <div className="factory-placeholder"><span>✧</span><h2>Votre plan apparaîtra ici</h2><p>Remplissez les informations du projet puis préparez votre première structure.</p></div> : <>
            <div className="factory-preview-head"><div><span className="eyebrow dark">CAHIER DE PROJET · BROUILLON</span><h2>{title}</h2></div><span className="factory-draft">Non publié</span></div>
            <div className="factory-summary"><b>Positionnement</b><p>{blueprint.positioning}</p><b>Promesse à valider</b><p>{blueprint.promise}</p></div>
            <h3>Structure proposée</h3>
            {blueprint.sections.map((section,index)=><article className="factory-section" key={section.title}><span>0{index+1}</span><div><b>{section.title}</b><p>{section.purpose}</p><ul>{section.actions.map(action=><li key={action}>{action}</li>)}</ul></div></article>)}
            <h3>Plan de lancement</h3><ol className="factory-steps">{blueprint.launch_steps.map(step=><li key={step}>{step}</li>)}</ol>
            <h3>Checklist avant lancement</h3><ul className="factory-checklist">{blueprint.checklist.map(item=><li key={item}>{item}</li>)}</ul>
            <button className="button button-primary" onClick={saveProject} disabled={saving}>{saving?"Enregistrement…":"Enregistrer ce cahier de projet →"}</button>
            <p className="offer-note">Ce plan est une base de travail générée à partir de vos réponses, pas une étude de marché ni un produit déjà créé.</p>
          </>}
        </section>
      </div>
      <section className="factory-saved"><div className="factory-saved-head"><div><span className="eyebrow dark">VOTRE BIBLIOTHÈQUE</span><h2>Mes projets enregistrés</h2></div><span>{projects.length} projet{projects.length>1?"s":""}</span></div>
        {projects.length===0?<p className="offer-empty">Aucun projet enregistré pour le moment. Votre premier cahier de projet apparaîtra ici.</p>:<div className="factory-project-grid">{projects.map(project=><article className="factory-project" key={project.id}><span className="factory-project-type">{types.find(item=>item.value===project.project_type)?.label??"Projet"}</span><h3>{project.title}</h3><p>{project.target_audience}</p><small>{new Date(project.created_at).toLocaleDateString("fr-FR")} · Brouillon</small></article>)}</div>}
      </section>
      <p className="workspace-footer">NEXBIZ AI · Construire d'abord utile, puis développer.</p>
    </section>
  </main>;
}
