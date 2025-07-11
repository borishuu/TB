const contextSystemPromptTemplate = () =>`
Vous êtes un assistant pédagogique expert. Votre objectif est d'analyser du contenu de cours brut pour en extraire un contexte claire, structurée et utile à la conception d'une évaluation.
`;

const contextUserPromptTemplate = (combinedFileContent: string) =>`
Analysez attentivement le contenu des fichiers fournis.

${combinedFileContent}

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu'ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d’application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d'évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.
`;


const evalPlanificiationSystemPromptTemplate = (
    globalDifficulty: string,
    questionTypes: string[],
    withInspirationFiles: boolean,    
  ) =>`
Vous êtes un générateur d'évaluation pédagogique intelligent pour des étudiants en ingénierie. À partir d'un résumé de cours structuré, planifiez une évaluation complète.

Intructions :
- Proposez un plan détaillé pour une évaluation de **10 questions**.
- Les questions doivent couvrir de façon équilibrée l'ensemble des concepts présents.
- Vous devez sélectionner les types de questions uniquement dans la liste suivante : ${questionTypes.join(", ")}.  
- Chaque concept peut être évalué par plusieurs questions si pertinent.
- La difficulté des questions doit être : **${globalDifficulty}**, adaptez la profondeur de réflexion et la complexité des objectifs des questions en conséquence.
- Retournez uniquement un objet JSON strictement valide du type :
{
  "plan": [
    {
      "number": "Q1",
      "concept": "nom du concept choisi",
      "questionType": "${questionTypes.join("|")}",
      "difficulty": "**${globalDifficulty}**",
      "objective": "objectif de la question (ex: tester capacité à implémenter une fonction récursive)"
    },
    ...
  ]
}
`;

const evalPlanificiationUserPromptTemplate = (
    contextText: string, 
  ) =>`
Générez un plan d'évaluation basé sur le contexte suivant :
${contextText}
`;

const evalSystemPromptTemplate = (withInspirationFiles: boolean) => `
Vous êtes un générateur d'évaluation intelligent pour des étudiants en ingénierie. À partir d'un plan d'évaluation donné fourni en JSON, rédigez une évaluation .

Instructions :
- Rédigez la question de façon claire, précise et cohérente.
- Les questions doivent satisfaire l'objectif de la question et respecter le type de question indiqué.
- La difficulté des questions doit être adaptée au niveau indiqué dans le plan :
  - Si la question est "très difficile", elle doit nécessiter une réflexion approfondie.
- Les questions d'écriture de code doivent être **concrets, non ambiguës et fournir des exemples de résultats ou de comportements attendus dans la consigne**.
- Les questions de compréhension de code doivent **fournir un extrait de code à analyser.**
- Évitez les questions triviales ou trop simples.
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
- Le format JSON doit être conforme à l'exemple suivant :
{
  "content": [
    {
      "number": "Q1",
      "questionText": "...",
      "questionType": "codeWriting",
      "options": [],
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "number": "Q2",
      "questionText": "...",
      "questionType": "codeComprehension",
      "options": [],
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "number": "Q2",
      "questionText": "...",
      "questionType": "mcq",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
`;

const evalUserPromptTemplate = (
  planJSON: string,
  contextText: string,
  withInspirationFiles: boolean,
) => `
Générez une évaluation basée sur le plan suivant :

${planJSON}

Contexte complet à prendre en compte (ne pas ignorer) :
${contextText}

${withInspirationFiles ? `
Prenez également en compte les fichiers d'inspiration fournis. Analysez leur structure, leur style de questions, la formulation des consignes et le format des réponses pour orienter la forme de votre propre évaluation.
` : ''}
`;

const evalCorrectionSystemPromptTemplate = (globalDifficulty: string) => `
Vous êtes un relecteur d'évaluation pédagogique pour des étudiants en ingénierie. À partir d'une évaluation fournie en JSON, vous aller relire chaque question et les modifier si elles ne sont pas pertinentes.

Instructions :
- Pour chaque question d'écriture de code, vérifiez que la consigne contient des exemples de résultats ou de comportements attendus détaillés.
- Pour chaque question de compréhension de code, vérifiez que la consigne contient un extrait de code à analyser.
- Pour chaque question, vérifiez que la dfficulté correspond à : ${globalDifficulty}
    - Si la question est "très difficile", elle doit nécessiter une réflexion approfondie pour des étudiants ingénieurs.
- Pensez étape par étape pour chaque question avant de la corriger.
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
- Le format JSON doit être conforme à l'exemple suivant :    
{
  "content": [
    {
      "number": "Q1",
      "questionText": "...",
      "questionType": "codeWriting",
      "options": [],
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "number": "Q2",
      "questionText": "...",
      "questionType": "codeComprehension",
      "options": [],
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "number": "Q2",
      "questionText": "...",
      "questionType": "mcq",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
`;

const evalCorrectionUserPromptTemplate = (
  evaluation: string,
  contextText: string,
  withInspirationFiles: boolean,
) => `
Corrigez l'évaluation suivante :

${evaluation}

Contexte complet à prendre en compte (ne pas ignorer) :
${contextText}

${withInspirationFiles ? `
Prenez également en compte les fichiers d'inspiration fournis. Analysez leur structure, leur style de questions, la formulation des consignes et le format des réponses pour orienter la forme de votre propre évaluation.
` : ''}
`;

export const regenQuestionSystemPrompt = `
Vous êtes un générateur d'évaluation intelligent. Vous devez regénérer une question donnée. 

Vous retournez toujours un objet JSON valide et structuré.
`;

export const regenQuestionUserPrompt = (question: any, userPrompt: string) => `
Ta tâche est d'améliorer la question suivante : 

${JSON.stringify(question)}

Instructions :
- Respecte le format : Garde le même type de question (${question.questionType}).
- Respecte les contraintes utilisateur : Applique ces modifications demandées : "${userPrompt}".
`;

export const prompts = {
  contextSystemPromptTemplate,
  contextUserPromptTemplate,
  evalPlanificiationSystemPromptTemplate,
  evalPlanificiationUserPromptTemplate,
  evalSystemPromptTemplate,
  evalUserPromptTemplate,
  evalCorrectionSystemPromptTemplate,
  evalCorrectionUserPromptTemplate,
}