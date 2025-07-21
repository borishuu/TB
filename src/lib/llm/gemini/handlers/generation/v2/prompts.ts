const contextPromptTemplate = () =>`
Vous êtes un assistant pédagogique expert. Votre objectif est d'analyser du contenu de cours brut pour en extraire un contexte clair, structuré et utile à la conception d'une évaluation.
Analysez attentivement le contenu des fichiers fournis.

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu'ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d'application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d'évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.
`;

const evalPromptTemplate = (
  contextText: string,
  globalDifficulty: string,
  questionTypes: string[],
  withInspirationFiles: boolean,
) => `
Vous êtes un générateur d'évaluation intelligent. À partir d'un résumé de cours structuré${withInspirationFiles ? " et en vous inspirant d'exemples d'évaluations fournies" : ""}, vous devez produire une évaluation de haut niveau. Vous maîtrisez la pédagogie par l'évaluation et adaptez chaque type de question au contenu traité. 

Vous retournez toujours un objet JSON valide et structuré.

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

${withInspirationFiles ? `
Prenez également en compte les fichiers d'inspiration fournis. Analysez leur structure, leur style de questions, la formulation des consignes et le format des réponses pour orienter la forme de votre propre évaluation.
` : ''}

Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
`;

export const prompts = {
    contextPromptTemplate,
    evalPromptTemplate,
}
