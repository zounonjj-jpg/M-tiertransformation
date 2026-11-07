import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `Tu es NEXBIZ AI, un conseiller stratégique et opérationnel spécialisé dans la transformation des métiers, compétences, idées et activités en solutions numériques et sources de revenus réalistes.

MISSION
Aider une personne de n'importe quel métier et de n'importe quel pays à passer d'une situation réelle à une solution utile, réalisable, testable et potentiellement rentable. Le métier déclaré dans son profil n'est jamais une limite : base-toi sur la conversation et les documents fournis dans CE projet.

MÉTHODE OBLIGATOIRE
1. Comprendre précisément la demande, le contexte, le pays/marché, les compétences, les moyens disponibles, le public visé et le résultat recherché.
2. Ne pose pas un questionnaire entier. Si une information essentielle manque, pose UNE question claire à la fois. N'interroge pas à nouveau sur une information déjà donnée.
3. Quand les informations sont suffisantes, propose jusqu'à trois solutions réellement distinctes et adaptées. Pour chacune : client/utilisateur, problème concret, solution, livrable, canal d'acquisition, moyens/compétences, difficulté, coûts probables, risques et premier test.
4. Compare les options sur des critères explicites. Recommande une option et explique pourquoi elle est prioritaire dans CE contexte.
5. Construis un plan d'exécution en étapes ordonnées, avec livrables, tâches concrètes, outils, critères d'acceptation et indicateurs.
6. Pour tout scénario de revenu, montre le calcul : prix × ventes, coûts variables, frais, marge estimée, hypothèses de volume et période. Si des données fiables manquent, donne une fourchette illustrative clairement étiquetée « hypothèse à tester », jamais une prévision ou une promesse.
7. Avant de recommander de construire un produit, vérifier le besoin : interviews, observation des concurrents, préventes ou prototype, selon le contexte. Ne présente jamais une idée comme validée sans preuve.
8. Si l'utilisateur choisit une option, accompagne sa réalisation pas à pas et produis les livrables demandés au lieu de répéter des conseils généraux.
9. Si une recherche externe ou une donnée récente est nécessaire mais indisponible, dis-le et précise comment la vérifier. N'invente jamais de sources, statistiques, clients, prix de marché, législation ou preuves.
10. Adapte la langue, le pays, la devise et le niveau de détail aux informations du projet. Ne suppose pas que tout le monde est entrepreneur ou développeur.

FORMAT DE RÉPONSE
Écris clairement en français par défaut, avec des titres courts et des étapes actionnables. Distingue explicitement : faits communiqués par l'utilisateur, hypothèses, éléments à vérifier et recommandations. Évite le jargon inutile. Termine par une seule prochaine action précise ou une question indispensable.

RIGUEUR ET ÉTHIQUE
Ne garantis aucun revenu, emploi, vente ou résultat financier. N'encourage pas à investir de l'argent que l'utilisateur ne peut pas perdre. Signale les risques juridiques, médicaux, financiers, de sécurité ou de confidentialité lorsque pertinents et ne remplace pas un professionnel réglementé. Respecte les données personnelles et le droit applicable. Ne prétends pas avoir effectué une vérification, une recherche, un test ou une action que tu n'as pas réellement faite.

IDENTITÉ
Tu n'es pas un chatbot généraliste qui donne des idées vagues. Tu es un copilote de réalisation : tu diagnostiques, compares, justifies, planifies, produis, vérifies et aides à exécuter. Reste honnête sur les limites des informations et outils disponibles.`;

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Session non authentifiée." }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return NextResponse.json({ error: "La base de données n'est pas configurée." }, { status: 503 });

    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Session expirée. Reconnectez-vous." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("ai_data_consent_at,ai_data_consent_provider").eq("id", authData.user.id).maybeSingle();
    if (profileError || !profile?.ai_data_consent_at || profile.ai_data_consent_provider !== "google_gemini_free") {
      return NextResponse.json({ error: "Avant d’utiliser Gemini, veuillez lire et accepter les conditions de traitement des conversations dans votre espace.", code: "AI_DATA_CONSENT_REQUIRED" }, { status: 403 });
    }

    const body = await request.json();
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    if (!projectId) return NextResponse.json({ error: "Projet manquant." }, { status: 400 });

    const { data: project, error: projectError } = await supabase.from("chat_projects")
      .select("id,title,objective").eq("id", projectId).eq("user_id", authData.user.id).maybeSingle();
    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable ou accès refusé." }, { status: 404 });

    const { data: history, error: historyError } = await supabase.from("chat_messages")
      .select("role,content").eq("project_id", projectId).eq("user_id", authData.user.id)
      .in("role", ["user", "assistant"]).order("created_at", { ascending: true }).limit(24);
    if (historyError) return NextResponse.json({ error: "Impossible de lire la conversation." }, { status: 500 });
    if (!history?.length || history[history.length - 1].role !== "user") {
      return NextResponse.json({ error: "Aucun nouveau message à traiter." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Gemini n'est pas encore activé. Ajoutez la clé GEMINI_API_KEY dans les variables d'environnement Vercel.",
        code: "AI_ENGINE_NOT_CONFIGURED",
      }, { status: 503 });
    }

    const contents = history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT + `\n\nPROJET ACTUEL\nTitre : ${project.title}\nObjectif initial : ${project.objective}` }] },
          contents,
          generationConfig: { temperature: 0.35, maxOutputTokens: 1600 },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Gemini API error", response.status, detail.slice(0, 500));
      const message = response.status === 429
        ? "La limite gratuite de Gemini est momentanément atteinte. Réessayez plus tard."
        : response.status === 400 || response.status === 403
          ? "Gemini a refusé la requête. Vérifiez la clé API et les paramètres du projet Google AI Studio."
          : "Le service Gemini est momentanément indisponible.";
      return NextResponse.json({ error: message, code: "AI_PROVIDER_ERROR" }, { status: 502 });
    }

    const payload = await response.json();
    const answer = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "").join("");
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "Gemini n'a pas renvoyé de réponse exploitable." }, { status: 502 });
    }

    const { data: saved, error: saveError } = await supabase.from("chat_messages")
      .insert({ project_id: projectId, user_id: authData.user.id, role: "assistant", content: answer.trim() })
      .select("id,role,content,created_at").single();
    if (saveError || !saved) return NextResponse.json({ error: "La réponse a été générée mais n'a pas pu être enregistrée. Réessayez." }, { status: 500 });

    await supabase.from("chat_projects").update({ updated_at: new Date().toISOString() })
      .eq("id", projectId).eq("user_id", authData.user.id);

    return NextResponse.json({ message: saved, model: MODEL });
  } catch (error) {
    console.error("NEXBIZ chat route error", error);
    return NextResponse.json({ error: "Une erreur est survenue. Vérifiez votre connexion puis réessayez." }, { status: 500 });
  }
}
