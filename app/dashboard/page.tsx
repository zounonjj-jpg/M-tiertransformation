"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = { id: string; title: string; objective: string; status: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };
type Profile = { full_name: string | null; onboarding_source: string | null; onboarding_reason: string | null; onboarding_completed_at: string | null; ai_data_consent_at: string | null; ai_data_consent_provider: string | null };

const starters = [
  "Je veux transformer mon métier en une source de revenus en ligne.",
  "J'ai une idée de projet et je veux savoir comment la rendre rentable.",
  "Je veux créer un site web ou une application pour développer mon activité.",
  "Je veux transformer mes connaissances en e-book ou formation à vendre."
];

function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 52 ? clean.slice(0, 49) + "…" : clean || "Nouveau projet";
}

function DashboardContent() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [source, setSource] = useState("");
  const [reason, setReason] = useState("");
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);\n  const [consentSaving, setConsentSaving] = useState(false);

  const loadProjects = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("chat_projects")
      .select("id,title,objective,status,updated_at").eq("user_id", uid)
      .neq("status", "archived").order("updated_at", { ascending: false });
    if (loadError) { setError(loadError.message); return; }
    const rows = (data ?? []) as Project[];
    setProjects(rows);
    const requested = new URLSearchParams(window.location.search).get("project");
    const selected = rows.find(p => p.id === requested) ?? rows[0] ?? null;
    setActive(selected);
  }, []);

  const loadMessages = useCallback(async (projectId: string) => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("chat_messages")
      .select("id,role,content,created_at").eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (loadError) { setError(loadError.message); return; }
    setMessages((data ?? []) as Message[]);
  }, []);

  useEffect(() => {
    let alive = true;
    async function init() {
      if (!supabase) { router.replace("/auth"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth"); return; }
      if (!alive) return;
      setUserId(user.id); setEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles")
        .select("full_name,onboarding_source,onboarding_reason,onboarding_completed_at,ai_data_consent_at,ai_data_consent_provider")
        .eq("id", user.id).maybeSingle();
      if (!alive) return;
      setProfile(p as Profile | null);
      if (p?.ai_data_consent_at && p?.ai_data_consent_provider === "google_gemini_free" && !p?.onboarding_completed_at) setOnboardingOpen(true);
      await loadProjects(user.id);
      setLoading(false);
    }
    void init();
    return () => { alive = false; };
  }, [router, loadProjects]);

  useEffect(() => { if (active?.id) void loadMessages(active.id); else setMessages([]); }, [active?.id, loadMessages]);

  async function createProject(event?: FormEvent) {
    event?.preventDefault();
    if (!supabase || !userId) return;
    const title = newTitle.trim() || titleFrom(newObjective);
    if (!newObjective.trim()) { setError("Décrivez en une phrase ce que vous voulez accomplir."); return; }
    setCreating(true); setError("");
    const { data, error: createError } = await supabase.from("chat_projects")
      .insert({ user_id: userId, title, objective: newObjective.trim() })
      .select("id,title,objective,status,updated_at").single();
    if (createError) setError(createError.message);
    else {
      const project = data as Project;
      setProjects(current => [project, ...current]); setActive(project);
      setNewTitle(""); setNewObjective(""); setMobileProjectsOpen(false);
      router.replace(`/dashboard?project=${project.id}`);
    }
    setCreating(false);
  }

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || !supabase || !userId || sending) return;
    setError(""); setSending(true);
    let project = active;
    if (!project) {
      const { data, error: createError } = await supabase.from("chat_projects")
        .insert({ user_id: userId, title: titleFrom(content), objective: content })
        .select("id,title,objective,status,updated_at").single();
      if (createError || !data) { setError(createError?.message ?? "Impossible de créer le projet."); setSending(false); return; }
      project = data as Project; setActive(project); setProjects(current => [project!, ...current]);
    }
    const { data: userMessage, error: userError } = await supabase.from("chat_messages")
      .insert({ project_id: project.id, user_id: userId, role: "user", content })
      .select("id,role,content,created_at").single();
    if (userError || !userMessage) { setError(userError?.message ?? "Message non enregistré."); setSending(false); return; }
    setMessages(current => [...current, userMessage as Message]); setDraft("");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setError("Votre session a expiré. Reconnectez-vous pour continuer.");
      setSending(false);
      return;
    }
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ projectId: project.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Le moteur NEXBIZ AI n'a pas pu répondre.");
      } else if (result.message) {
        setMessages(current => [...current, result.message as Message]);
      }
    } catch {
      setError("Connexion au moteur NEXBIZ AI impossible. Votre message reste enregistré ; vous pouvez réessayer.");
    }
    await loadProjects(userId);
    setSending(false);
  }

  async function finishOnboarding(skip = false) {
    if (!supabase || !userId) return;
    const update = { onboarding_source: skip ? null : source || null, onboarding_reason: skip ? null : reason || null, onboarding_completed_at: new Date().toISOString() };
    const { error: saveError } = await supabase.from("profiles").update(update).eq("id", userId);
    if (saveError) { setError(saveError.message); return; }
    setProfile(current => current ? { ...current, ...update } : current); setOnboardingOpen(false);
  }

  async function signOut() { await supabase?.auth.signOut(); router.push("/"); }

  if (loading) return <main className="chat-loading">Ouverture de votre espace NEXBIZ AI…</main>;
  const name = profile?.full_name?.split(" ")[0] || email.split("@")[0] || "Bienvenue";
  const activeTitle = active?.title ?? "Nouvelle conversation";

  return <main className="nex-chat-shell">
    <aside className={`chat-sidebar ${mobileProjectsOpen ? "mobile-open" : ""}`}>
      <div className="chat-brand-row"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link><button className="mobile-close" onClick={() => setMobileProjectsOpen(false)} aria-label="Fermer">×</button></div>
      <button className="new-chat-button" onClick={() => { setActive(null); setMessages([]); setMobileProjectsOpen(false); router.replace("/dashboard"); }}>＋ Nouveau projet</button>
      <div className="chat-project-label">VOS PROJETS</div>
      <div className="chat-project-list">
        {projects.length === 0 ? <p className="chat-project-empty">Vos conversations et projets apparaîtront ici.</p> :
          projects.map(project => <button key={project.id} className={`chat-project-item ${active?.id === project.id ? "active" : ""}`} onClick={() => { setActive(project); setMobileProjectsOpen(false); router.replace(`/dashboard?project=${project.id}`); }}><span>◌</span><span>{project.title}</span></button>)}
      </div>
      <div className="chat-sidebar-bottom"><Link href="/dashboard/factory">Bibliothèque de contenus ↗</Link><div className="chat-user"><span className="chat-avatar">{name.slice(0,1).toUpperCase()}</span><span><b>{name}</b><small>{email}</small></span></div><button className="chat-logout" onClick={signOut}>Déconnexion</button></div>
    </aside>

    <section className="chat-main">
      <header className="chat-topbar"><button className="mobile-menu" onClick={() => setMobileProjectsOpen(true)} aria-label="Ouvrir les projets">☰</button><div><span className="chat-top-eyebrow">ESPACE DE TRANSFORMATION</span><b>{activeTitle}</b></div><span className="chat-plan">Découverte</span></header>
      <div className="chat-scroll">
        {!active && messages.length === 0 ? <div className="chat-welcome">
          <span className="chat-welcome-mark">✳</span><p className="chat-top-eyebrow">NEXBIZ AI · FROM SKILLS TO BUSINESS</p>
          <h1>Bonjour {name}.<br/><em>Que voulez-vous transformer aujourd'hui ?</em></h1>
          <p className="chat-welcome-copy">Expliquez votre métier, votre idée ou votre difficulté. Nous allons partir de votre demande, pas d'un profil obligatoire.</p>
          <form className="chat-compose chat-first-compose" onSubmit={e => { e.preventDefault(); void sendMessage(); }}>
            <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ex. : Je suis menuisier et je veux trouver des clients grâce au numérique…" rows={3}/>
            <div className="chat-compose-bottom"><span>Décrivez librement votre besoin</span><button disabled={!draft.trim() || sending}>Envoyer ↑</button></div>
          </form>
          <div className="chat-starters">{starters.map(item=><button key={item} onClick={()=>void sendMessage(item)}>{item}<span>↗</span></button>)}</div>
        </div> : <>
          <div className="chat-conversation">
            <div className="chat-conversation-heading"><span className="chat-top-eyebrow">PROJET EN COURS</span><h2>{activeTitle}</h2><p>{active?.objective}</p></div>
            {messages.map(message=><article key={message.id} className={`chat-message ${message.role}`}><span className="chat-message-avatar">{message.role === "user" ? "VOUS" : "N"}</span><div className="chat-message-content"><b>{message.role === "user" ? "Vous" : "NEXBIZ AI"}</b><p>{message.content}</p></div></article>)}
            {sending && <div className="chat-thinking">Préparation de votre réponse…</div>}
          </div>
        </>}
        {error && <p className="chat-error">{error}</p>}
      </div>
      {(active || messages.length > 0) && <form className="chat-compose chat-bottom-compose" onSubmit={e=>{e.preventDefault();void sendMessage();}}>
        <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Continuez votre projet ici…" rows={2}/>
        <div className="chat-compose-bottom"><span>Une conversation distincte par projet</span><button disabled={!draft.trim() || sending}>Envoyer ↑</button></div>
      </form>}
      <footer className="chat-disclaimer">NEXBIZ AI doit valider les hypothèses avant de présenter une estimation de revenus. Aucun résultat financier n'est garanti.</footer>
    </section>

    {(!profile?.ai_data_consent_at || profile?.ai_data_consent_provider !== "google_gemini_free") && <div className="onboarding-overlay"><section className="onboarding-card"><span className="chat-top-eyebrow">INFORMATION IMPORTANTE · GEMINI</span><h2>Autoriser l’assistant IA</h2><p>Pour générer vos réponses, NEXBIZ AI transmettra le contenu de vos messages et le contexte de votre projet à Google Gemini. Avec l’offre gratuite de l’API Gemini, Google peut utiliser les données envoyées pour améliorer ses produits. Évitez donc de partager des mots de passe, données bancaires ou informations confidentielles.</p><p>Vous pouvez refuser sans perdre l’accès au reste de votre espace ; le moteur IA restera simplement désactivé.</p><button className="button button-primary onboarding-submit" disabled={consentSaving} onClick={()=>void acceptGeminiConsent()}>{consentSaving ? "Enregistrement…" : "J’accepte et je continue →"}</button><button className="onboarding-skip" onClick={()=>{setError("Le moteur IA restera désactivé tant que vous n’aurez pas accepté le traitement des conversations par Google Gemini.");}}>Refuser pour le moment</button></section></div>}\n    {onboardingOpen && profile?.ai_data_consent_at && <div className="onboarding-overlay"><section className="onboarding-card"><button className="onboarding-close" onClick={()=>void finishOnboarding(true)} aria-label="Fermer">×</button><span className="chat-top-eyebrow">UNE PETITE QUESTION · FACULTATIF</span><h2>Comment avez-vous connu NEXBIZ AI ?</h2><select value={source} onChange={e=>setSource(e.target.value)}><option value="">Choisir une réponse (facultatif)</option><option>Réseaux sociaux</option><option>Un ami ou un proche</option><option>Recherche Google</option><option>Vidéo ou publicité</option><option>Autre</option></select><h2>Pourquoi souhaitez-vous utiliser NEXBIZ AI ?</h2><select value={reason} onChange={e=>setReason(e.target.value)}><option value="">Choisir une réponse (facultatif)</option><option>Créer une activité ou un revenu en ligne</option><option>Développer mon activité actuelle</option><option>Créer un produit numérique</option><option>Créer un site web ou une application</option><option>Résoudre un problème professionnel</option><option>Explorer une idée</option></select><button className="button button-primary onboarding-submit" onClick={()=>void finishOnboarding(false)}>Continuer vers mon chat →</button><button className="onboarding-skip" onClick={()=>void finishOnboarding(true)}>Passer cette étape</button></section></div>}
  </main>;
}

export default function DashboardPage() {
  return <DashboardContent />;
}
