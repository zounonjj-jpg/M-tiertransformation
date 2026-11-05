"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Section = { title: string; purpose: string; actions: string[] };
type Blueprint = { positioning?: string; promise?: string; sections?: Section[]; launch_steps?: string[]; checklist?: string[]; deliverable?: { title: string; body: string; updated_at: string; version: number } };
type Project = { id:string; title:string; description:string|null; project_type:string; target_audience:string; goal:string; blueprint:Blueprint; status:"draft"|"in_progress"|"completed"|"archived"; created_at:string; updated_at:string };

const labels:Record<string,string>={website:"Site web",catalogue:"Catalogue numérique",ebook:"E-book / guide",course:"Formation en ligne",mobile_app:"Application mobile"};
const statuses:Record<Project["status"],string>={draft:"Brouillon",in_progress:"En cours",completed:"Terminé",archived:"Archivé"};

function buildContentDraft(project:Project):string{
 const bp=project.blueprint??{};
 const sections=bp.sections??[];
 const audience=project.target_audience;
 const goal=project.goal;
 const title=project.title;
 const chapter=(name:string,purpose:string,actions:string[])=>[
  `## ${name}`,
  purpose,
  "",
  "### Les points essentiels",
  ...actions.map((item,index)=>`${index+1}. ${item}.`),
  "",
  "### Mise en pratique",
  `Pour appliquer cette partie à votre situation, commencez par observer votre contexte, choisissez une action simple liée à « ${goal} », puis notez le résultat obtenu.`,
  "",
  "### Exemple à personnaliser",
  "[Insérez ici un exemple réel, une démonstration ou une étude de cas que vous êtes autorisé à partager.]",
  "",
  "### Exercice",
  "1. Quelle est votre situation aujourd'hui ?",
  "2. Quelle action allez-vous réaliser ?",
  "3. Comment saurez-vous que cette action a fonctionné ?",
  ""
 ];
 if(project.project_type==="ebook"){
  const chapters=sections.map((s,i)=>chapter(`Chapitre ${i+1} — ${s.title}`,s.purpose,s.actions??[])).flat();
  return [
   `# ${title}`,
   "## Guide pratique — première version éditoriale",
   "",
   `**Pour qui ?** ${audience}`,
   `**Objectif du guide :** ${goal}`,
   "",
   "## Avant de commencer",
   `Ce guide a été conçu pour les personnes qui souhaitent avancer sur le sujet suivant : ${goal}. Il propose une progression pratique, avec des étapes et des exercices à adapter à votre réalité. Il ne remplace pas un accompagnement professionnel lorsque celui-ci est nécessaire.`,
   "",
   "## Ce que vous allez retirer de ce guide",
   "- Comprendre les éléments essentiels du sujet.",
   "- Identifier les erreurs et les priorités.",
   "- Passer de la réflexion à des actions concrètes.",
   "- Évaluer vos progrès et décider de la suite.",
   "",
   "## Introduction",
   `Bienvenue dans « ${title} ». Si vous faites partie de ${audience}, vous avez probablement besoin d'une méthode claire pour avancer sur : ${goal}. Ce document vous accompagne étape par étape. Prenez le temps de répondre aux exercices et adaptez les recommandations à votre situation.`,
   "",
   ...chapters,
   "## Conclusion — votre prochain pas",
   `Vous disposez maintenant d'une structure pour progresser sur « ${goal} ». Ne cherchez pas à tout changer en une journée. Choisissez une action prioritaire, fixez une échéance et observez les résultats. Revenez ensuite aux chapitres concernés pour ajuster votre méthode.`,
   "",
   "## Plan d'action sur 7 jours",
   "1. Jour 1 : décrivez votre situation et votre objectif.",
   "2. Jour 2 : identifiez les obstacles prioritaires.",
   "3. Jour 3 : choisissez une première action réalisable.",
   "4. Jour 4 : appliquez cette action et consignez vos observations.",
   "5. Jour 5 : demandez un retour à une personne concernée.",
   "6. Jour 6 : améliorez votre approche.",
   "7. Jour 7 : mesurez les progrès et définissez la prochaine étape.",
   "",
   "## À propos de l'auteur",
   "[Ajoutez votre nom professionnel, votre parcours vérifiable, votre expérience et vos coordonnées.]",
   "",
   "## Ressources et références",
   "[Ajoutez uniquement des ressources fiables que vous avez consultées et que vous êtes autorisé à citer.]",
   "",
   "> À finaliser : ajoutez vos exemples originaux, vérifiez chaque affirmation, complétez les références et faites relire le manuscrit avant toute commercialisation."
  ].join("\n");
 }
 if(project.project_type==="website"){
  return [
   `# ${title}`,
   "## Accueil",
   `### Une solution pensée pour ${audience}`,
   `# ${goal}`,
   `Vous cherchez une manière claire et fiable d'avancer sur ce besoin ? ${title} présente une solution conçue pour vous aider à passer à l'action, avec des informations transparentes et un accompagnement adapté à votre situation.`,
   "**Appel à l'action :** Demander des informations · Obtenir un devis · Prendre rendez-vous",
   "",
   "## Le problème que nous aidons à résoudre",
   `Lorsque ${audience} rencontrent le défi suivant : ${goal}, il devient difficile de savoir quelle décision prendre ou par où commencer. Notre approche consiste à clarifier le besoin, proposer une réponse adaptée et expliquer les prochaines étapes.`,
   "",
   "## Notre solution",
   `Avec ${title}, vous découvrez une offre structurée autour de votre besoin. Chaque prestation doit préciser ce qui est inclus, les délais, les conditions et les résultats raisonnablement attendus.`,
   "",
   "## Nos services / fonctionnalités",
   ...sections.map((s,i)=>`### ${i+1}. ${s.title}\n${s.purpose}\n- ${(s.actions??[]).join("\n- ")}`),
   "",
   "## Comment ça fonctionne",
   "1. Vous nous expliquez votre besoin.",
   "2. Nous clarifions votre situation et les options possibles.",
   "3. Vous recevez une proposition détaillée avec les conditions.",
   "4. Le travail commence après validation des modalités.",
   "",
   "## Pourquoi nous faire confiance ?",
   "- Des informations claires sur les prestations.",
   "- Des conditions et délais communiqués avant engagement.",
   "- Des exemples et références authentiques, publiés avec autorisation.",
   "",
   "## Questions fréquentes",
   "### Comment obtenir un tarif ?\nContactez-nous en précisant votre besoin. Un devis ou une grille tarifaire doit être communiqué avant toute commande.",
   "### Quels sont les délais ?\nLes délais dépendent du périmètre convenu. Ils doivent être confirmés dans votre proposition.",
   "### Comment commencer ?\nUtilisez le moyen de contact indiqué sur cette page.",
   "",
   "## Contact",
   "**Nom / entreprise :** [À compléter]",
   "**Téléphone / WhatsApp :** [À compléter]",
   "**E-mail :** [À compléter]",
   "**Adresse / zone desservie :** [À compléter]",
   "",
   "> Avant publication : remplacez les champs entre crochets, ajoutez vos tarifs et preuves vérifiables, vérifiez vos mentions légales et testez chaque lien."
  ].join("\n");
 }
 if(project.project_type==="catalogue"){
  return [
   `# Catalogue — ${title}`,
   `## Une sélection pour ${audience}`,
   `Ce catalogue présente nos produits et services pour répondre au besoin suivant : ${goal}.`,
   "",
   "## Comment utiliser ce catalogue",
   "Consultez les fiches, vérifiez les caractéristiques et la disponibilité, puis contactez-nous pour confirmer votre commande.",
   "",
   "## Nos catégories",
   ...sections.map((s,i)=>`### ${i+1}. ${s.title}\n${s.purpose}`),
   "",
   "## Fiches produits / services à compléter",
   "### Produit / service 01 — [Nom]",
   "- Description : [Décrivez précisément le produit ou la prestation.]",
   "- Caractéristiques : [Dimensions, matière, durée, options ou spécifications.]",
   "- Prix : [Montant et devise.]",
   "- Disponibilité : [En stock, sur commande, dates.]",
   "- Livraison / exécution : [Zone, délai et conditions.]",
   "- Photo : [Ajoutez une image dont vous détenez les droits.]",
   "",
   "### Produit / service 02 — [Nom]",
   "- Description : [À compléter.]",
   "- Caractéristiques : [À compléter.]",
   "- Prix : [À compléter.]",
   "- Disponibilité : [À compléter.]",
   "",
   "## Commander",
   "1. Envoyez le nom ou la référence du produit.",
   "2. Confirmez la disponibilité et le prix total.",
   "3. Validez le mode de paiement et de livraison.",
   "4. Conservez la confirmation de commande.",
   "",
   "## Conditions",
   "- Paiement : [À préciser.]",
   "- Livraison / exécution : [À préciser.]",
   "- Retours et réclamations : [À préciser selon la réglementation applicable.]",
   "- Contact : [Téléphone, WhatsApp et e-mail.]",
   "",
   "> Complétez chaque fiche avec des informations exactes. Ne publiez pas de prix, photos, stocks ou témoignages non vérifiés."
  ].join("\n");
 }
 if(project.project_type==="course"){
  const modules=sections.map((s,i)=>[
   `## Module ${i+1} — ${s.title}`,
   `**Objectif :** ${s.purpose}`,
   "### Leçons",
   ...(s.actions??[]).map((a,j)=>`${j+1}. ${a}`),
   "### Activité pratique",
   "[Décrivez une activité à réaliser et le livrable attendu.]",
   "### Vérification des acquis",
   "- Quelle notion essentielle retenez-vous ?",
   "- Comment l'appliquer dans un cas réel ?",
   ""
  ].join("\n"));
  return [
   `# Formation : ${title}`,
   `## Présentation`,
   `Cette formation s'adresse à ${audience}. Elle vise à : ${goal}.`,
   "",
   "## Résultats pédagogiques attendus",
   "- Expliquer les notions fondamentales du sujet.",
   "- Appliquer une méthode progressive.",
   "- Produire un résultat concret et l'évaluer.",
   "",
   "## Public et prérequis",
   `**Public :** ${audience}`,
   "**Niveau :** [Débutant / intermédiaire / avancé]",
   "**Prérequis :** [À préciser]",
   "**Matériel :** [À préciser]",
   "",
   "## Parcours de formation",
   ...modules,
   "## Évaluation finale",
   "Proposez un exercice pratique qui mobilise les compétences de tous les modules. Définissez des critères d'évaluation visibles avant le début de l'exercice.",
   "",
   "## Accompagnement",
   "- Support : [À préciser]",
   "- Durée d'accès : [À préciser]",
   "- Modalités de questions : [À préciser]",
   "- Attestation ou certificat : [À préciser uniquement si réellement délivré.]",
   "",
   "> Avant de vendre : rédigez les leçons complètes, enregistrez les vidéos si prévues, testez les exercices et indiquez clairement la durée, le niveau et les conditions d'accès."
  ].join("\n");
 }
 return [
  `# Cahier fonctionnel — ${title}`,
  `## Vision du produit`,
  `L'application s'adresse à ${audience} et doit résoudre le besoin suivant : ${goal}.`,
  "",
  "## Utilisateurs principaux",
  "- Utilisateur cible : [profil, contexte et besoins]",
  "- Administrateur : [rôle et responsabilités]",
  "",
  "## Parcours utilisateur",
  "1. Découvrir la proposition de valeur.",
  "2. Créer un compte ou accéder à une démonstration si nécessaire.",
  "3. Compléter les informations indispensables.",
  "4. Réaliser l'action principale.",
  "5. Consulter le résultat et obtenir de l'aide.",
  "",
  "## Écrans essentiels",
  ...sections.map((s,i)=>`### ${i+1}. ${s.title}\n${s.purpose}\n- ${(s.actions??[]).join("\n- ")}`),
  "",
  "## Exigences fonctionnelles",
  "- Décrire les rôles et permissions.",
  "- Prévoir les états de chargement, succès, erreur et absence de données.",
  "- Valider les formulaires côté client et côté serveur.",
  "- Prévoir une suppression ou un export des données selon les règles applicables.",
  "",
  "## Sécurité et confidentialité",
  "- Collecter uniquement les données nécessaires.",
  "- Protéger les comptes et les accès.",
  "- Limiter chaque utilisateur à ses propres données.",
  "- Expliquer la politique de confidentialité et la durée de conservation.",
  "",
  "## MVP et critères d'acceptation",
  "- Une fonction principale utilisable de bout en bout.",
  "- Un parcours de test documenté.",
  "- Aucun blocage critique connu.",
  "- Retours de 3 à 5 utilisateurs pilotes analysés.",
  "",
  "> Ce document est une première spécification. Les maquettes, le code, les tests de sécurité et la publication restent à réaliser."
 ].join("\n");
}

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
 const [draftBody,setDraftBody]=useState("");
 const [contentSaving,setContentSaving]=useState(false);
 const [contentNotice,setContentNotice]=useState("");
 const [contentError,setContentError]=useState("");
 const load=useCallback(async()=>{
  if(!supabase){router.replace("/auth");return;}
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/auth");return;}
  const {data,error:loadError}=await supabase.from("business_projects").select("id,title,description,project_type,target_audience,goal,blueprint,status,created_at,updated_at").eq("id",params.id).eq("user_id",user.id).maybeSingle();
  if(loadError)setError(loadError.message);
  const loaded=data as Project|null;setProject(loaded);if(loaded?.blueprint?.deliverable?.body){setDraftBody(loaded.blueprint.deliverable.body);}setLoading(false);
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

 function createContentDraft(){
  if(!project)return;
  setDraftBody(buildContentDraft(project));
  setContentNotice("Un premier contenu a été préparé. Personnalisez-le avant de le publier ou de le vendre.");
  setContentError("");
 }
 async function saveContentDraft(){
  if(!supabase||!project||!draftBody.trim())return;
  setContentSaving(true);setContentError("");setContentNotice("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setContentSaving(false);router.replace("/auth");return;}
  const nextBlueprint={...(project.blueprint??{}),deliverable:{title:project.title,body:draftBody,updated_at:new Date().toISOString(),version:1}};
  const {error:saveError}=await supabase.from("business_projects").update({blueprint:nextBlueprint,updated_at:new Date().toISOString()}).eq("id",project.id).eq("user_id",user.id);
  if(saveError)setContentError(saveError.message);
  else{setProject({...project,blueprint:nextBlueprint});setContentNotice("Votre contenu est enregistré dans votre espace privé.");}
  setContentSaving(false);
 }
 function downloadDeliverable(format:"md"|"html"){
  if(!project||!draftBody.trim())return;
  const safe=project.title.replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()||"contenu-nexbiz";
  if(format==="md"){
   const blob=new Blob([draftBody],{type:"text/markdown;charset=utf-8"});
   const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`${safe}-contenu.md`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);return;
  }
  const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));
  const htmlBody=draftBody.split("\n").map(line=>{
   const value=escapeHtml(line.trim());
   if(!value)return "";
   if(value.startsWith("### "))return `<h3>${value.slice(4)}</h3>`;
   if(value.startsWith("## "))return `<h2>${value.slice(3)}</h2>`;
   if(value.startsWith("# "))return `<h1>${value.slice(2)}</h1>`;
   if(value.startsWith("- "))return `<p>• ${value.slice(2)}</p>`;
   if(/^\\d+\\. /.test(value))return `<p>${value}</p>`;
   if(value.startsWith("> "))return `<blockquote>${value.slice(2)}</blockquote>`;
   return `<p>${value.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>")}</p>`;
  }).join("\n");
  const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.title)}</title><style>body{margin:0;background:#f5f7f2;color:#17251d;font:16px/1.8 Georgia,serif}.document{max-width:820px;margin:36px auto;padding:clamp(24px,6vw,64px);background:#fff;box-shadow:0 10px 40px #17251d12}h1,h2,h3{font-family:system-ui,sans-serif;line-height:1.25;color:#173b2b}h1{font-size:2.4rem}h2{margin-top:2.2em;border-bottom:1px solid #e5ece2;padding-bottom:.4em}blockquote{border-left:4px solid #a8d96b;padding:8px 18px;background:#f6faef;color:#53634f}footer{margin-top:48px;border-top:1px solid #e5ece2;padding-top:18px;color:#778278;font:12px system-ui}</style></head><body><main class="document">${htmlBody}<footer>Document de travail créé avec NEXBIZ AI · Vérifiez et personnalisez le contenu avant diffusion.</footer></main></body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`${safe}-document.html`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
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

    <section className="factory-content-studio">
     <div className="factory-content-head"><div><span className="eyebrow dark">ATELIER DE PRODUCTION</span><h2>Votre contenu numérique</h2><p>Créez un premier manuscrit ou document exploitable, personnalisez-le et conservez-le dans votre espace.</p></div><span className="factory-draft">{draftBody.trim()?"Contenu préparé":"À produire"}</span></div>
     {!draftBody.trim()?<div className="factory-content-empty"><div><b>Prêt à produire votre premier contenu ?</b><p>NEXBIZ AI va préparer une base adaptée au type de projet, à votre public et à votre objectif.</p></div><button type="button" className="button button-primary" onClick={createContentDraft}>Créer mon premier contenu →</button></div>:<>
      <label className="factory-content-label">Contenu modifiable<textarea className="factory-content-editor" rows={22} value={draftBody} onChange={event=>{setDraftBody(event.target.value);setContentNotice("");}} spellCheck /></label>
      <div className="factory-content-actions"><button type="button" className="button button-primary" disabled={contentSaving} onClick={()=>void saveContentDraft()}>{contentSaving?"Enregistrement…":"Enregistrer le contenu"}</button><button type="button" className="button button-secondary" onClick={()=>downloadDeliverable("md")}>Exporter en Markdown (.md)</button><button type="button" className="button button-secondary" onClick={()=>downloadDeliverable("html")}>Exporter en document HTML (.html)</button><button type="button" className="button button-secondary" onClick={createContentDraft}>Recréer le brouillon</button></div>
      <p className="offer-note">Le contenu est un premier brouillon structuré, pas une rédaction validée par un expert ni une publication automatique. Ajoutez votre savoir-faire, vérifiez les faits et remplacez les indications entre crochets.</p>
     </>}
     {contentError&&<p className="form-alert error">{contentError}</p>}{contentNotice&&<p className="form-alert success">{contentNotice}</p>}
    </section>
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
