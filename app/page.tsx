"use client";

import { useState } from "react";

const features = [
  { n: "01", title: "Comprendre votre potentiel", text: "L’IA analyse votre métier, vos compétences et les opportunités de votre marché." },
  { n: "02", title: "Construire votre business", text: "Créez une offre claire, choisissez vos prix et bâtissez un modèle économique adapté." },
  { n: "03", title: "Lancer votre activité", text: "Préparez votre présence digitale, vos contenus marketing et vos outils de vente." },
  { n: "04", title: "Développer vos revenus", text: "Suivez vos clients, vos ventes et vos performances depuis un seul espace." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main>
    <header className="nav wrap">
      <a className="brand" href="#"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></a>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu">☰</button>
      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <a href="#solution" onClick={() => setMenuOpen(false)}>La solution</a><a href="#fonctionnement" onClick={() => setMenuOpen(false)}>Comment ça marche</a><a href="#vision" onClick={() => setMenuOpen(false)}>Notre vision</a>
      </nav>
      <a className="nav-cta" href="/auth?mode=signup">Commencer <span>↗</span></a>
    </header>

    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse" /> L’INTELLIGENCE QUI ENTREPREND AVEC VOUS</div>
        <h1>Votre talent mérite<br/>de devenir un <em>business.</em></h1>
        <p className="hero-lead">NEXBIZ AI transforme vos compétences, votre métier ou votre expérience en une activité numérique structurée, prête à se développer.</p>
        <div className="hero-actions"><a className="button button-primary" href="/auth?mode=signup">Construire mon business <span>→</span></a><a className="text-link" href="#fonctionnement">Découvrir la méthode <span>↘</span></a></div>
        <div className="hero-proof"><div className="proof-avatars"><i>✦</i><i>✧</i><i>✺</i></div><span>Une idée, un métier, une ambition.<br/><b>Tout commence avec vous.</b></span></div>
      </div>
      <div className="hero-visual" aria-label="Aperçu du tableau de bord NEXBIZ AI">
        <div className="visual-glow" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="dashboard-card">
          <div className="dash-top"><span className="dash-dot" /><span>VOTRE ESPACE BUSINESS</span><span className="dash-live">● EN DIRECT</span></div>
          <div className="dash-greeting">Bonjour, entrepreneur <span>✦</span></div>
          <div className="dash-title">Votre prochaine étape</div>
          <div className="dash-project"><div className="project-icon">✳</div><div><b>Votre activité, révélée</b><small>Analyse de potentiel & stratégie</small></div><span className="project-arrow">↗</span></div>
          <div className="dash-stats"><div><small>VOTRE POTENTIEL</small><b>À découvrir</b></div><div><small>PROCHAINE ACTION</small><b>Créer votre offre</b></div></div>
          <div className="dash-progress"><span style={{width:"68%"}} /></div>
          <div className="dash-bottom"><span>Votre parcours commence ici</span><span>01 / 04</span></div>
        </div>
        <div className="float-chip chip-top"><span>✦</span> Intelligence métier</div><div className="float-chip chip-bottom"><span>↗</span> De l’idée à l’action</div>
      </div>
    </section>

    <section className="ticker"><div className="ticker-track"><span>VOTRE MÉTIER</span><b>✳</b><span>VOS COMPÉTENCES</span><b>✳</b><span>VOTRE EXPÉRIENCE</span><b>✳</b><span>VOTRE AVENIR</span><b>✳</b><span>VOTRE MÉTIER</span><b>✳</b><span>VOS COMPÉTENCES</span></div></section>

    <section className="section wrap" id="solution"><div className="section-heading"><div><div className="eyebrow dark">UNE NOUVELLE FAÇON D’ENTREPRENDRE</div><h2>Vous avez déjà<br/>ce qu’il faut pour <em>commencer.</em></h2></div><p>Que vous soyez artisan, enseignant, commerçant, créateur, indépendant ou salarié, votre savoir-faire peut ouvrir de nouvelles possibilités.</p></div>
      <div className="feature-grid">{features.map((f) => <article className="feature" key={f.n}><span className="feature-number">{f.n}</span><div className="feature-icon">{["⌕","✳","↗","▥"][Number(f.n)-1]}</div><h3>{f.title}</h3><p>{f.text}</p><span className="feature-line" /></article>)}</div>
    </section>

    <section className="manifesto" id="vision"><div className="wrap manifesto-inner"><div className="eyebrow"><span className="pulse" /> NOTRE CONVICTION</div><h2>Le monde n’a pas besoin<br/>que vous soyez quelqu’un d’autre.<br/><em>Il a besoin de ce que vous savez faire.</em></h2><p>NEXBIZ AI vous donne les outils pour passer de votre savoir-faire à une activité qui vous ressemble.</p></div></section>

    <section className="steps wrap" id="fonctionnement"><div className="eyebrow dark">SIMPLE. GUIDÉ. AMBITIEUX.</div><h2>Votre parcours commence<br/>par une <em>conversation.</em></h2><div className="steps-row"><div><b>01</b><h3>Parlez-nous de vous</h3><p>Votre métier, vos talents, vos objectifs.</p></div><div><b>02</b><h3>Recevez votre plan</h3><p>Une stratégie adaptée à votre situation.</p></div><div><b>03</b><h3>Passez à l’action</h3><p>Construisez et développez votre activité.</p></div></div></section>

    <section className="final-cta" id="demarrer"><div className="wrap final-inner"><div><div className="eyebrow"><span className="pulse" /> LE PROCHAIN CHAPITRE VOUS APPARTIENT</div><h2>Et si votre métier<br/>devenait votre <em>prochain succès ?</em></h2></div><a className="button button-light" href="/auth?mode=signup">Je veux me lancer <span>↗</span></a></div></section>
    <footer className="footer wrap"><a className="brand" href="#"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></a><span>From Skills to Business.</span><span>© 2026 NEXBIZ AI. Tous droits réservés.</span></footer>
  </main>;
}
