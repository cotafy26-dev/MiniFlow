"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { QuizQuestion } from "@/lib/validations/products";
import { cn } from "@/lib/utils";

/**
 * Ungraded on purpose — no attempt/score is persisted anywhere. The
 * learner picks an answer per question, reveals correct/incorrect inline.
 * Completing the lesson still goes through the same "Marcar como
 * concluída" action as every other content type, never auto-triggered by
 * answering.
 */
export function QuizRenderer({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, index) => (
        <div key={question.id} className="flex flex-col gap-2 rounded-xl border p-4">
          <p className="text-sm font-medium">
            {index + 1}. {question.prompt}
          </p>
          <RadioGroup
            value={answers[question.id] !== undefined ? String(answers[question.id]) : undefined}
            onValueChange={(value) =>
              setAnswers((prev) => ({ ...prev, [question.id]: Number(value) }))
            }
            className="flex flex-col gap-1.5"
          >
            {question.options.map((option, optionIndex) => {
              const isSelected = answers[question.id] === optionIndex;
              const isCorrect = optionIndex === question.correctIndex;
              return (
                <Field
                  key={optionIndex}
                  orientation="horizontal"
                  className={cn(
                    "rounded-lg px-2 py-1",
                    revealed && isCorrect && "bg-primary/10",
                    revealed && isSelected && !isCorrect && "bg-destructive/10"
                  )}
                >
                  <RadioGroupItem value={String(optionIndex)} id={`${question.id}-${optionIndex}`} />
                  <label htmlFor={`${question.id}-${optionIndex}`} className="flex-1 text-sm">
                    {option}
                  </label>
                  {revealed && isCorrect && <CheckCircle2 className="size-4 text-primary" />}
                  {revealed && isSelected && !isCorrect && (
                    <XCircle className="size-4 text-destructive" />
                  )}
                </Field>
              );
            })}
          </RadioGroup>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-fit" onClick={() => setRevealed(true)}>
        {pt.products.quiz.reveal}
      </Button>
    </div>
  );
}
