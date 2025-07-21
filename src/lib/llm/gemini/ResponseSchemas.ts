import { Schema, SchemaType } from '@google/generative-ai';

export const questionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
      number: {
          type: SchemaType.STRING,
          description: "The question number. It must always be a number without any letters.",
          nullable: false
      },
      questionText: {
          type: SchemaType.STRING,
          description: "The text of the question.",
          nullable: false
      },
      questionType: {
          type: SchemaType.STRING,
          format: "enum",
          description: "The type of the question.",
          enum: ["mcq", "open", "codeComprehension", "codeWriting"],
          nullable: false
      },
      options: {
          type: SchemaType.ARRAY,
          description: "Array of answer options for multiple choice questions.",
          items: {
              type: SchemaType.STRING
          },
          minItems: 0
      },
      correctAnswer: {
          type: SchemaType.STRING,
          description: "The correct answer for the question.",
          nullable: false
      }
  },
  required: ["number", "questionText", "questionType", "correctAnswer"]
};

export const evalSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    content: {
      type: SchemaType.ARRAY,
      minItems: 10,
      items: questionSchema,
    },
  },
  required: ['content'],
};