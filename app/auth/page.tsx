"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const roles = [
  ["entrepreneur", "Entrepreneur / porteur de projet"],
  ["freelancer", "Indépendant / freelance"],
  ["artisan", "Artisan / professionnel"],
  ["merchant", "Commerçant"],
  ["creator", "Créateur / formateur"],
  ["student", "Étudiant"],
  ["employee", "Salarié"],
  ["other", "Autre profil"],
];

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("entrepreneur");
  const [customProfession, setCustomProfession] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError("La connexion à la base de données n'est pas encore configurée. Les clés Supabase doivent être ajoutées aux variables d'environnement du site.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role, country, custom_profession: role === "other" ? customProfession.trim() : "" } },
        });
        if (authError) throw authError;
        if (data.session) router.push("/dashboard");
        else setMessage("Votre compte a été créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
    } finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <div className="auth-brand"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link><span className="auth-tag">FROM SKILLS TO BUSINESS</span></div>
    <section className="auth-card">
      <Link href="/" className="back-link">← Retour à l'accueil</Link>
      <div className="eyebrow dark">VOTRE AVENIR PROFESSIONNEL COMMENCE ICI</div>
      <h1>{mode === "signup" ? "Créons votre espace." : "Ravi de vous revoir."}</h1>
      <p className="auth-intro">{mode === "signup" ? "Quelques informations pour commencer à transformer votre savoir-faire en opportunité." : "Connectez-vous pour retrouver votre espace et continuer votre parcours."}</p>
      <div className="auth-tabs"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("");setMessage("");}}>Inscription</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");setMessage("");}}>Connexion</button></div>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && <>
          <label>Nom complet<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Votre nom et prénom" required autoComplete="name"/></label>
          <label>Je suis<select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
          {role === "other" && <label>Quel est votre métier ou votre activité ?<input value={customProfession} onChange={e=>setCustomProfession(e.target.value)} placeholder="Ex. : médecin, maçon, infirmier…" required maxLength={120}/></label>}
          <label>Pays<input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Votre pays" autoComplete="country-name"/></label>
        </>}
        <label>Adresse e-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" required autoComplete="email"/></label>
        <label>Mot de passe<div className="password-wrap"><input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 caractères minimum" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"}/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? "Masquer" : "Afficher"}</button></div></label>
        {error && <p className="form-alert error">{error}</p>}{message && <p className="form-alert success">{message}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "signup" ? "Créer mon espace →" : "Me connecter →"}</button>
      </form>
      <p className="auth-legal">En continuant, vous acceptez d'utiliser NEXBIZ AI de manière responsable. Vos informations personnelles restent liées à votre compte.</p>
    </section>
    <p className="auth-foot">© 2026 NEXBIZ AI · Construisons la suite ensemble.</p>
  </main>;
}

export default function AuthPage() {
  return <Suspense fallback={<main className="auth-shell"><p>Chargement…</p></main>}><AuthContent /></Suspense>;
}
