"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Section = { title: string; purpose: string; actions: string[] };
type Blueprint = { positioning?: string; promise?: string; sections?: Section[]; launch_steps?: string[]; checklist?: string[] };
type Project = { id:string; title:string; description:string|null; project_type:string; target_audience:string; goal:string; blueprint:Blueprint; status:"draft"|"in_progress"|"completed"|"archived"; created_at:string; updated_at:string };

const labels:Record<string,string>={website:"Site web",catalogue:"Catalogue numérique",ebook:"E-book / guide",course:"Formation en ligne",mobile_app:"Application mobile"};
const statuses:Record<Project["status"],string>={draft:"Brouillon",in_progress:"En cours",completed:"Terminé",archived:"Archivé"};

export default function FactoryProjectPage(){
 const params=useParams<{id:string}>();
 const router=useRouter();
 const [project,setProject]=useState<Project|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [editing,setEditing]=useState(false);
 const [editTitle,setEditTitle]=useState("");
 const [editAudience,setEditAudience]=useState("");
 const [editGoal,setEditGoal]=useState("");
 const load=useCallback(async()=>{
  if(!supabase){router.replace("/auth");return;}
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/auth");return;}
  const {data,error:loadError}=await supabase.from("business_projects").select("id,title,description,project_type,target_audience,goal,blueprint,status,created_at,updated_at").eq("id",params.id).eq("user_id",user.id).maybeSingle();
  if(loadError)setError(loadError.message);
  setProject(data as Project|null);setLoading(false);
 },[params.id,router]);
 useEffect(()=>{void load();},[load]);
 function startEditing(){if(!project)return;setEditTitle(project.title);setEditAudience(project.target_audience);setEditGoal(project.goal);setEditing(true);setError("");setNotice("");}
 async function saveProjectDetails(){
  if(!supabase||!project)return;
  if(!editTitle.trim()||!editAudience.trim()||!editGoal.trim()){setError("Le nom, le public cible et l’objectif sont obligatoires.");return;}
  setSaving(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setSaving(false);router.replace("/auth");return;}
  const {error:updateError}=await supabase.from("business_projects").update({title:editTitle.trim(),target_audience:editAudience.trim(),goal:editGoal.trim(),updated_at:new Date().toISOString()}).eq("id",project.id).eq("user_id",user.id);
  if(updateError)setError(updateError.message);
  else{setProject({...project,title:editTitle.trim(),target_audience:editAudience.trim(),goal:editGoal.trim(),updated_at:new Date().toISOString()});setEditing(false);setNotice("Les informations du projet ont été enregistrées.");}
  setSaving(false);
 }
 async function changeStatus(status:Project["status"]){
  if(!supabase||!project)return;
  setSaving(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/auth");return;}
  const {error:updateError}=await supabase.from("business_projects").update({status,updated_at:new Date().toISOString()}).eq("id",project.id).eq("user_id",user.id);
  if(updateError)setError(updateError.message);
  else{setProject({...project,status});setNotice("L'état du projet a été mis à jour.");}
  setSaving(false);
 }
 function exportProject(){
  if(!project)return;
  const lines=[
   `# ${project.title}`,
   `Type : ${labels[project.project_type]??"Projet"}`,
   `Créé le : ${new Date(project.created_at).toLocaleDateString("fr-FR")}`,
   `Statut : ${statuses[project.status]}`,
   "",
   "## Public cible",
   project.target_audience,
   "",
   "## Objectif",
   project.goal,
   "",
   "## Positionnement",
   blueprint.positioning??project.description??"À définir",
   "",
   "## Promesse à vérifier",
   blueprint.promise??"À définir",
   "",
   "## Structure proposée",
   ...(blueprint.sections??[]).flatMap((section,index)=>[
    `### ${index+1}. ${section.title}`,
    section.purpose,
    ...(section.actions??[]).map(action=>`- ${action}`),
    ""
   ]),
   "## Plan de lancement",
   ...(blueprint.launch_steps??[]).map((step,index)=>`${index+1}. ${step}`),
   "",
   "## Checklist",
   ...(blueprint.checklist??[]).map(item=>`- [ ] ${item}`),
   "",
   "---",
   "Document préparé avec NEXBIZ AI. Vérifiez les informations et validez votre marché avant publication."
  ];
  const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`${project.title.trim().replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()||"projet"}-nexbiz.md`;
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 }

 function downloadText(filename:string,content:string,mime:string){
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 }
 function exportEbookDraft(){
  if(!project)return;
  const sections=blueprint.sections??[];
  const lines=[
   `# ${project.title}`,
   "**Premier brouillon éditorial — à personnaliser et vérifier avant commercialisation**",
   "",
   "## À qui s'adresse ce guide ?",
   project.target_audience,
   "",
   "## Résultat visé",
   project.goal,
   "",
   "## Introduction",
   `Bienvenue dans « ${project.title} ». Ce guide s'adresse à ${project.target_audience}. Son objectif est de vous aider à avancer sur le sujet suivant : ${project.goal}. Adaptez cette introduction à votre expérience, à votre méthode et aux besoins réellement observés chez vos lecteurs.`,
   "",
   ...sections.flatMap((section,index)=>[
    `## Chapitre ${index+1} — ${section.title}`,
    section.purpose,
    "",
    "### À développer",
    ...(section.actions??[]).map(action=>`- ${action}`),
    "",
    "### Exemple concret à ajouter",
    "[Ajoutez ici une situation réelle, un exemple original ou une démonstration issue de votre expérience.]",
    "",
    "### Exercice du lecteur",
    "[Proposez une action simple que le lecteur peut réaliser après ce chapitre.]",
    ""
   ]),
   "## Conclusion et plan d'action",
   `Vous avez parcouru les étapes proposées pour avancer sur : ${project.goal}. Choisissez une première action réalisable, fixez une date et évaluez le résultat. Complétez cette conclusion avec vos conseils personnels et les prochaines ressources utiles.`,
   "",
   "## À propos de l'auteur",
   "[Présentez votre parcours, votre expérience vérifiable et vos coordonnées professionnelles.]",
   "",
   "---",
   "Document de travail préparé par NEXBIZ AI. Ce brouillon n'est pas un livre final : vérifiez les faits, ajoutez votre expertise, vos exemples originaux et relisez le contenu avant toute vente."
  ];
  downloadText(`${project.title.replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()||"ebook"}-brouillon-nexbiz.md`,lines.join("\n"),"text/markdown;charset=utf-8");
 }
 function exportWebsiteStarter(){
  if(!project)return;
  const esc=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));
  const title=esc(project.title),audience=esc(project.target_audience),goal=esc(project.goal);
  const sections=(blueprint.sections??[]).map(section=>`<section><h2>${esc(section.title)}</h2><p>${esc(section.purpose)}</p><ul>${(section.actions??[]).map(action=>`<li>${esc(action)}</li>`).join("")}</ul></section>`).join("\n");
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${goal}"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;font:16px/1.7 system-ui,sans-serif;color:#17251d;background:#f6f8f3}header,main,footer{width:min(960px,calc(100% - 36px));margin:auto}header{padding:28px 0;display:flex;justify-content:space-between;gap:16px;align-items:center}header strong{font-size:20px}.hero{padding:76px 0 64px}.eyebrow{color:#5c8d39;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:12px}h1{font-size:clamp(38px,7vw,64px);line-height:1.08;letter-spacing:-2px;max-width:760px;margin:14px 0}p{color:#617067}.cta{display:inline-block;background:#142d21;color:white;padding:13px 20px;border-radius:7px;text-decoration:none;font-weight:700;margin-top:12px}section{background:white;border:1px solid #e4eae1;border-radius:12px;padding:26px;margin:18px 0}h2{margin-top:0}footer{padding:30px 0;color:#7a867d;font-size:13px}@media(max-width:600px){.hero{padding:50px 0 35px}section{padding:20px}}</style></head><body><header><strong>${title}</strong><a class="cta" href="mailto:contact@example.com">Nous contacter</a></header><main><div class="hero"><div class="eyebrow">Une solution pour ${audience}</div><h1>${title}</h1><p>${goal}</p><a class="cta" href="mailto:contact@example.com">Parlons de votre besoin</a></div>${sections}</main><footer>© <span id="year"></span> ${title} · Remplacez les coordonnées de démonstration avant publication.</footer><script>document.getElementById('year').textContent=new Date().getFullYear()</script></body></html>`;
  downloadText(`${project.title.replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()||"site"}-starter.html`,html,"text/html;charset=utf-8");
 }
 async function removeProject(){
  if(!supabase||!project)return;
  if(!window.confirm("Supprimer définitivement ce dossier de projet ?"))return;
  setSaving(true);setError("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/auth");return;}
  const {error:deleteError}=await supabase.from("business_projects").delete().eq("id",project.id).eq("user_id",user.id);
  if(deleteError){setError(deleteError.message);setSaving(false);}
  else router.replace("/dashboard/factory");
 }
 if(loading)return <main className="dashboard-loading">Ouverture du dossier…</main>;
 if(!project)return <main className="workspace"><section className="workspace-main"><h1>Dossier introuvable</h1><p>Ce projet n'existe pas ou n'est pas accessible depuis votre compte.</p><Link className="button button-primary" href="/dashboard/factory">Retour à la Digital Factory</Link></section></main>;
 const blueprint=project.blueprint??{};
 return <main className="workspace">
  <aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXBIZ<span className="brand-ai"> AI</span></span></Link><div className="side-label">VOTRE ESPACE</div><Link className="side-link" href="/dashboard">⌂ <span>Vue d'ensemble</span></Link><Link className="side-link" href="/dashboard/analyse">⌕ <span>Mon diagnostic</span></Link><Link className="side-link" href="/dashboard/offres">◇ <span>Mes offres</span></Link><Link className="side-link" href="/dashboard/clients">◎ <span>Prospects & clients</span></Link><Link className="side-link selected" href="/dashboard/factory">✧ <span>Digital Factory</span></Link></aside>
  <section className="workspace-main">
   <div className="workspace-top"><div><span className="eyebrow dark">DOSSIER DIGITAL FACTORY</span><h1>{project.title}</h1><p>{labels[project.project_type]??"Projet numérique"} · Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}</p></div><Link className="account-pill" href="/dashboard/factory">← Mes projets</Link></div>
   <section className="factory-detail-card"><div className="factory-detail-head"><div><span className="factory-project-type">{labels[project.project_type]??"Projet"}</span><h2>Votre cahier de projet</h2></div><div className="factory-detail-head-actions"><span className="factory-draft">{statuses[project.status]}</span><button type="button" className="button button-secondary" onClick={startEditing}>Modifier les informations</button></div></div>
    {editing&&<div className="factory-edit-form"><h3>Modifier le projet</h3><label>Nom du projet<input maxLength={140} value={editTitle} onChange={event=>setEditTitle(event.target.value)}/></label><label>Public cible<input maxLength={240} value={editAudience} onChange={event=>setEditAudience(event.target.value)}/></label><label>Objectif principal<textarea rows={3} maxLength={800} value={editGoal} onChange={event=>setEditGoal(event.target.value)}/></label><div className="factory-detail-head-actions"><button type="button" className="button button-primary" disabled={saving} onClick={()=>void saveProjectDetails()}>{saving?"Enregistrement…":"Enregistrer les modifications"}</button><button type="button" className="button button-secondary" disabled={saving} onClick={()=>setEditing(false)}>Annuler</button></div></div>}
    <div className="factory-summary"><b>Public cible</b><p>{project.target_audience}</p><b>Objectif principal</b><p>{project.goal}</p><b>Positionnement</b><p>{blueprint.positioning??project.description}</p><b>Promesse à vérifier</b><p>{blueprint.promise??"À définir."}</p></div>
    <h3>Structure proposée</h3>
    {(blueprint.sections??[]).map((section,index)=><article className="factory-section" key={section.title}><span>{String(index+1).padStart(2,"0")}</span><div><b>{section.title}</b><p>{section.purpose}</p><ul>{section.actions.map(action=><li key={action}>{action}</li>)}</ul></div></article>)}
    <h3>Plan de lancement</h3><ol className="factory-steps">{(blueprint.launch_steps??[]).map(step=><li key={step}>{step}</li>)}</ol>
    <h3>Checklist avant lancement</h3><ul className="factory-checklist">{(blueprint.checklist??[]).map(item=><li key={item}>{item}</li>)}</ul>
    {error&&<p className="form-alert error">{error}</p>}{notice&&<p className="form-alert success">{notice}</p>}
    <div className="factory-detail-actions">{project.project_type==="ebook"&&<button type="button" className="button button-primary" onClick={exportEbookDraft}>Télécharger le brouillon e-book (.md)</button>}{project.project_type==="website"&&<button type="button" className="button button-primary" onClick={exportWebsiteStarter}>Télécharger le starter du site (.html)</button>}<button type="button" className="button button-secondary" onClick={exportProject}>Télécharger le cahier (.md)</button><label>État du projet<select value={project.status} disabled={saving} onChange={event=>void changeStatus(event.target.value as Project["status"])}><option value="draft">Brouillon</option><option value="in_progress">En cours</option><option value="completed">Terminé</option><option value="archived">Archivé</option></select></label><button className="offer-delete" disabled={saving} onClick={()=>void removeProject()}>{saving?"Traitement…":"Supprimer le dossier"}</button></div>
    <p className="offer-note">Ce cahier est une base de travail. Il ne remplace pas la validation du marché et ne constitue pas encore un produit numérique publié.</p>
   </section>
  </section>
 </main>;
}
