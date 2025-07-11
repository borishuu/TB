const regenQuestionPromptTemplate = (question: any, userPrompt: string) => `
Vous êtes un générateur d'évaluation intelligent. Vous devez regénérer une question donnée. 

Ta tâche est d'améliorer la question suivante : 

${JSON.stringify(question)}

Instructions :
- Respecte le format : Garde le même type de question (${question.questionType}).
- Respecte les contraintes utilisateur : Applique ces modifications demandées : "${userPrompt}".
`;

export const prompts = {
    regenQuestionPromptTemplate,
}