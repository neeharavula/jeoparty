import { useState } from "react";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/motion-primitives/morphing-popover";

/* base for all question types */
type BaseQuestion = {
  id: string;
  points: number;
  prompt: string;
};

/* multiple choice question */
type MultipleChoiceQuestion = BaseQuestion & {
  questionType: "multiple_choice";
  choices: string[];
  correctAnswer: string;
};

/* free text question */
type FreeTextQuestion = BaseQuestion & {
  questionType: "free_text";
  correctAnswer: string;
};

/* draft a question (discriminated union) */
type QuestionDraft = MultipleChoiceQuestion | FreeTextQuestion;

/* draft a category */
type CategoryDraft = {
  id: string;
  name: string;
  questions: QuestionDraft[];
};

/* create a question */
function createEmptyQuestion(points: number): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    points,
    prompt: "",
    questionType: "free_text",
    correctAnswer: "",
  };
}

/* create a category column */
function createEmptyCategory(): CategoryDraft {
  const pointValues = [100, 200, 300, 400, 500];
  return {
    id: crypto.randomUUID(),
    name: "",
    questions: pointValues.map((points) => createEmptyQuestion(points)),
  };
}

/* initialize board */
function initBoard(): CategoryDraft[] {
  return Array.from({ length: 5 }, () => createEmptyCategory());
}

/* setup page */
function SetupPage() {
  const [categories, setCategories] = useState<CategoryDraft[]>(initBoard);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );

  /* edit category*/
  function editCategory(categoryId: string, newName: string) {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId ? { ...category, name: newName } : category,
      ),
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <h1>setup</h1>
      <div className="flex justify-center gap-5 font-mono text-sm">
        {categories.map((category) => (
          <div key={category.id} className="flex flex-col gap-5 w-30">
            <input
              className="bg-[#a6c5d2] p-2.5 rounded-[10px] border-none font-mono text-sm text-center"
              value={category.name}
              onChange={(event) =>
                editCategory(category.id, event.target.value)
              }
            />
            {category.questions.map((question) => (
              <MorphingPopover
                key={question.id}
                open={editingQuestionId === question.id}
                onOpenChange={(isOpen) =>
                  setEditingQuestionId(isOpen ? question.id : null)
                }
              >
                <MorphingPopoverTrigger asChild>
                  <div className="bg-[#dcdcdc] p-5 rounded-[10px]  w-full">
                    {question.points}
                  </div>
                </MorphingPopoverTrigger>
                <MorphingPopoverContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                  <p>form goes here</p>
                  <button onClick={() => setEditingQuestionId(null)}>
                    Save
                  </button>
                </MorphingPopoverContent>
              </MorphingPopover>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SetupPage;
