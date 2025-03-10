'use client'

import { useEffect, useState } from "react";

export default function Home() {
  const [quiz, setQuiz] = useState<String>("");
  const [loading, setLoading] = useState<Boolean>(false);

  const generateQuizGemini = async () => {
    console.log("quiz generation request")
    setQuiz("")
    const response = await fetch('/api/gemini/quiz');
    const data = await response.json();
    setQuiz(data);
    console.log("quiz generation completed")
  }

  const generateQuizGeminiTwoPhase = async () => {
    console.log("quiz generation request")
    setQuiz("");
    setLoading(true);
    const response = await fetch('/api/gemini/quiz/two-phase');
    const data = await response.json();
    console.log(data.context);
    setLoading(false);
    setQuiz(data.quiz);
    console.log("quiz generation completed")
  }

  const uploadFile = async () => {
    console.log("upload file request")
    const response = await fetch('/api/gemini/file');
    const data = await response.json();
    console.log(data);
  }


  return (
    <div className="items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center sm:items-start">
        <button type="button" onClick={uploadFile} className="bg-gray-50 rounded-lg p-2 text-black mb-2">
          Upload file(s)
        </button>
        <button type="button" onClick={generateQuizGeminiTwoPhase} className="bg-gray-50 rounded-lg p-2 text-black mb-2">
          Generate quiz (two-phase)
        </button>

        {loading && (
          <div className="flex flex-col items-center">
            <img src="/loading.gif" alt="Loading..." className="w-12 h-12 mb-2" />
            <p>Génération du quiz en cours...</p>
          </div>
        )}

        {!loading && quiz !== "" &&
          quiz.split("\n").map((paragraph: string, index: number) => {
            const isQuestion = paragraph.trim().match(/^\*\*\d+\./);
            return (
              <p key={index} className={isQuestion ? "mt-6 mb-4 font-bold" : "mt-1"}>
                {paragraph}
              </p>
            );
        })}

      </main>
    </div>
  );
}
