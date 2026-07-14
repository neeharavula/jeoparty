import { useState } from "react";

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

  /* edit category*/
  function editCategory(categoryId: string, newName: string) {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId ? { ...category, name: newName } : category,
      ),
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-5">
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
              <div
                key={question.id}
                className="bg-[#dcdcdc] p-5 rounded-[10px]"
              >
                {question.points}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SetupPage;
