const contextSystemPromptTemplate = () => `
Vous êtes un assistant pédagogique expert. Votre objectif est d'analyser du contenu de cours brut pour en extraire un contexte claire, structurée et utile à la conception d'une évaluation.
`;

const contextUserPromptTemplate = (combinedFileContent: string) =>`
Analysez attentivement le contenu des fichiers fournis.

${combinedFileContent}

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu'ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d'application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d'évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.
`;

const evalSystemPromptTemplate = (
  combinedInspirationContent: string, 
  globalDifficulty: string,
  questionTypes: string[]
) => `
Vous êtes un générateur d'évaluation intelligent. À partir d'un résumé de cours structuré${combinedInspirationContent !== "" ? " et en vous inspirant d'exemples d'évaluations fournies" : ""}, vous devez produire une évaluation de haut niveau. Vous maîtrisez la pédagogie par l'évaluation et adaptez chaque type de question au contenu traité. 

Instructions :
- Générez exactement 10 questions, couvrant l'ensemble des concepts abordés dans le contexte.
- L'ordre des questions doit être indépendant de celui des chapitres ou sections du contexte.
- La difficulté globale de l'évaluation doit être : **${globalDifficulty}**. Ajustez la profondeur des questions, le degré de réflexion requis et la complexité des exemples en conséquence.
- Vous devez utiliser uniquement les types de questions suivants (et les varier intelligemment) : ${questionTypes.join(", ")}.
- Sélectionnez le type de question le plus pertinent pour chaque concept :
  - Si la notion est pratique ou liée à la programmation, privilégiez la compréhension de code ou l'écriture de code.
  - Si la notion est théorique ou conceptuelle, privilégiez des QCM ou questions ouvertes.
  - Si un concept présente plusieurs facettes (théorique + pratique), vous pouvez mélanger les types ou choisir celui qui permet la meilleure évaluation de la compréhension.
- **Les questions d'écriture de code doivent fournir des exemples de résultats ou de comportements attendus.**
    - Voici un exemple de question d'écriture de code attendu :
        **
        Dans le cadre d'une application de gestion des sessions, on récolte des valeurs mesurées
        progressivement dans le temps. Un \`Record\` représente l'enregistrement d'une valeur (existante ou
        non) à un temps précis.
        Implémenter la fonction sessionWindow, qui prend en paramètre
            — ll : une LazyList[Record] contenant des valeurs mesurées progressivement dans le
            temps, et
            — maxGap : l'intervalle de temps maximum permis entre deux sessions successives.

        et qui retourne
            — une LazyList[List[Record]] contenant les sessions regroupés.

        Exemple de résultat :
        \`\`\`scala
            val input = LazyList(Record(1, None), Record(2, Some(2.5)), Record(4, None),
            Record(8, None), Record(19, Some(19.5)))
            val output = LazyList(List(Record(1,None), Record(2,Some(2.5)), Record(4,None)),
            List(Record(8,None)), List(Record(19,Some(19.5))))
            assert(sessionWindow(input, 2).toList == output.toList)
            type Time = Long
            type Measure = Double
            case class Record(ts: Time, measure: Option[Measure])
            def sessionWindow(ll: LazyList[Record], maxGap: Time): LazyList[List[Record]] =
        \`\`\`
        **
- Évitez les questions triviales ou trop simples.
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
- Le format JSON doit être conforme à l'exemple suivant :

Exemple :
{
  "content": [
    {
      "number": "Q1",
      "questionText": "...",
      "questionType": "...",
      "options": [],
      "correctAnswer": "...",
      "explanation": "...."
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
  contextText: string,
  combinedInspirationContent: string,
) => `
Générez une évaluation basée sur le contexte suivant :

${contextText}

${combinedInspirationContent !== "" ? `
Prenez également en compte les fichiers d'inspiration fournis. Analysez leur structure, leur style de questions, la formulation des consignes et le format des réponses pour orienter la forme de votre propre évaluation :
${combinedInspirationContent}
` : ''}
`;

export const prompts = {
  contextSystemPromptTemplate,
  contextUserPromptTemplate,
  evalSystemPromptTemplate,
  evalUserPromptTemplate,
}