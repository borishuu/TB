export const regenQuestionSystemPromptTemplate = () => `
Vous êtes un générateur d'évaluation intelligent. Vous devez regénérer une question donnée. 

Vous retournez toujours un objet JSON valide et structuré.
`;

export const regenQuestionUserPromptTemplate = (question: any, userPrompt: string) => `
Ta tâche est d'améliorer la question suivante : 

${JSON.stringify(question)}

Instructions :
- Respecte le format : Garde le même type de question (${question.questionType}).
- Respecte les contraintes utilisateur : Applique ces modifications demandées : "${userPrompt}".
`;

export const prompts = {
    regenQuestionSystemPromptTemplate,
    regenQuestionUserPromptTemplate
}