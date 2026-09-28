"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { LessonValues } from "@/lib/validations/products";

function newQuestion() {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  };
}

export function QuizQuestionEditor({ control }: { control: Control<LessonValues> }) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "quizData.questions",
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">{pt.products.quiz.empty}</p>
      )}

      {fields.map((field, questionIndex) => (
        <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder={pt.products.quiz.promptPlaceholder}
              value={field.prompt}
              onChange={(e) => update(questionIndex, { ...field, prompt: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(questionIndex)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>

          <RadioGroup
            value={String(field.correctIndex)}
            onValueChange={(value) =>
              update(questionIndex, { ...field, correctIndex: Number(value) })
            }
            className="flex flex-col gap-1.5"
          >
            {field.options.map((option, optionIndex) => (
              <Field key={optionIndex} orientation="horizontal">
                <RadioGroupItem value={String(optionIndex)} id={`${field.id}-${optionIndex}`} />
                <Input
                  value={option}
                  placeholder={`${pt.products.quiz.optionPlaceholder} ${optionIndex + 1}`}
                  onChange={(e) => {
                    const options = [...field.options];
                    options[optionIndex] = e.target.value;
                    update(questionIndex, { ...field, options });
                  }}
                  className="flex-1"
                />
              </Field>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">{pt.products.quiz.correctHint}</p>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => append(newQuestion())}>
        <Plus className="size-4" />
        {pt.products.quiz.addQuestion}
      </Button>
    </div>
  );
}

export { newQuestion as newQuizQuestion };
