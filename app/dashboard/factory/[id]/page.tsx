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
 const load=useCallback(async()=>{
  if(!supabase){router.replace("/auth");return;}
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/auth");return;}
  const {data,error:loadError}=await supabase.from("business_projects").select("id,title,description,project_type,target_audience,goal,blueprint,status,created_at,updated_at").eq("id",params.id).eq("user_id",user.id).maybeSingle();
  if(loadError)setError(loadError.message);
  setProject(data as Project|null);setLoading(false);
 },[params.id,router]);
 useEffect(()=>{void load();},[load]);
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
  const blob=new Blob([lines.join("\\n")],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`${project.title.trim().replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()||"projet"}-nexbiz.md`;
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
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
   <section className="factory-detail-card"><div className="factory-detail-head"><div><span className="factory-project-type">{labels[project.project_type]??"Projet"}</span><h2>Votre cahier de projet</h2></div><span className="factory-draft">{statuses[project.status]}</span></div>
    <div className="factory-summary"><b>Public cible</b><p>{project.target_audience}</p><b>Objectif principal</b><p>{project.goal}</p><b>Positionnement</b><p>{blueprint.positioning??project.description}</p><b>Promesse à vérifier</b><p>{blueprint.promise??"À définir."}</p></div>
    <h3>Structure proposée</h3>
    {(blueprint.sections??[]).map((section,index)=><article className="factory-section" key={section.title}><span>{String(index+1).padStart(2,"0")}</span><div><b>{section.title}</b><p>{section.purpose}</p><ul>{section.actions.map(action=><li key={action}>{action}</li>)}</ul></div></article>)}
    <h3>Plan de lancement</h3><ol className="factory-steps">{(blueprint.launch_steps??[]).map(step=><li key={step}>{step}</li>)}</ol>
    <h3>Checklist avant lancement</h3><ul className="factory-checklist">{(blueprint.checklist??[]).map(item=><li key={item}>{item}</li>)}</ul>
    {error&&<p className="form-alert error">{error}</p>}{notice&&<p className="form-alert success">{notice}</p>}
    <div className="factory-detail-actions"><button type="button" className="button button-secondary" onClick={exportProject}>Télécharger le cahier (.md)</button><label>État du projet<select value={project.status} disabled={saving} onChange={event=>void changeStatus(event.target.value as Project["status"])}><option value="draft">Brouillon</option><option value="in_progress">En cours</option><option value="completed">Terminé</option><option value="archived">Archivé</option></select></label><button className="offer-delete" disabled={saving} onClick={()=>void removeProject()}>{saving?"Traitement…":"Supprimer le dossier"}</button></div>
    <p className="offer-note">Ce cahier est une base de travail. Il ne remplace pas la validation du marché et ne constitue pas encore un produit numérique publié.</p>
   </section>
  </section>
 </main>;
}
