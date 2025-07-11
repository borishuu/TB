const contextSystemPromptTemplate = () => `
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

const evalSystemPromptTemplate = (withInspirationFiles: boolean) => `
Vous êtes un générateur d'évaluation intelligent. À partir d'un résumé de cours structuré${withInspirationFiles ? " et en vous inspirant d'exemples d'évaluations fournies" : ""}, vous devez produire une évaluation de haut niveau. Vous maîtrisez la pédagogie par l’évaluation et adaptez chaque type de question au contenu traité. 

Vous retournez toujours un objet JSON valide et structuré.
`;

const evalUserPromptTemplate = (
  contextText: string,
  globalDifficulty: string,
  questionTypes: string[],
  withInspirationFiles: boolean,
) => `
Générez une évaluation basée sur le contexte suivant :

${contextText}

Instructions :
- Générez exactement 10 questions, couvrant l'ensemble des concepts abordés dans le contexte.
- L'ordre des questions doit être indépendant de celui des chapitres ou sections du contexte.
- La difficulté globale de l'évaluation doit être : **${globalDifficulty}**. Ajustez la profondeur des questions, le degré de réflexion requis et la complexité des exemples en conséquence.
- Vous devez utiliser uniquement les types de questions suivants (et les varier intelligemment) : ${questionTypes.join(", ")}.
- Sélectionnez le type de question le plus pertinent pour chaque concept :
  - Si la notion est pratique ou liée à la programmation, privilégiez la compréhension de code ou l'écriture de code.
  - Si la notion est théorique ou conceptuelle, privilégiez des QCM ou questions ouvertes.
  - Si un concept présente plusieurs facettes (théorique + pratique), vous pouvez mélanger les types ou choisir celui qui permet la meilleure évaluation de la compréhension.
- Les questions d'écriture de code doivent fournir des exemples de résultats ou de comportements attendus.
- Évitez les questions triviales ou trop simples.
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
- Le format JSON doit être conforme à l'exemple suivant :

Exemple :
{
  "content": [
    {
      "number": "Q1",
      "questionText": "Qu'est-ce que la récursion ?",
      "questionType": "open",
      "options": [],
      "correctAnswer": "La récursion est une méthode où une fonction s'appelle elle-même.",
      "explanation": "La récursion permet de résoudre un problème en le divisant en sous-problèmes similaires."
    },
    {
      "number": "Q2",
      "questionText": "Quelle est la sortie du code suivant ?\\n\\nfunction f(n) {\\n  if (n <= 1) return 1;\\n  return n * f(n - 1);\\n}\\nf(3);",
      "questionType": "codeComprehension",
      "options": [],
      "correctAnswer": "6",
      "explanation": "La fonction calcule la factorielle : f(3) = 3 * 2 * 1 = 6."
    },
    {
      "number": "Q3",
      "questionText": "Choisissez les bonnes réponses concernant la récursion.",
      "questionType": "mcq",
      "options": [
        "Elle nécessite toujours une condition d'arrêt.",
        "Elle est plus rapide que l'itération dans tous les cas.",
        "Elle peut mener à un dépassement de pile si mal utilisée.",
        "Elle ne peut pas être utilisée pour parcourir des structures arborescentes."
      ],
      "correctAnswer": "Elle nécessite toujours une condition d'arrêt.; Elle peut mener à un dépassement de pile si mal utilisée.",
      "explanation": "Sans condition d'arrêt, la récursion boucle à l'infini et cause un dépassement de pile."
    }
  ]
}

${withInspirationFiles ? `
Prenez également en compte les fichiers d'inspiration fournis. Analysez leur structure, leur style de questions, la formulation des consignes et le format des réponses pour orienter la forme de votre propre évaluation.
` : ''}

Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
`;


export const prompts = {
    contextSystemPromptTemplate,
    contextUserPromptTemplate,
    evalSystemPromptTemplate,
    evalUserPromptTemplate,
} 