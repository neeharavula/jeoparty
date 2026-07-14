import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/motion-primitives/dialog";

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

  function updateQuestion(
    categoryId: string,
    questionId: string,
    updater: (question: QuestionDraft) => QuestionDraft,
  ) {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              questions: category.questions.map((question) =>
                question.id !== questionId ? question : updater(question),
              ),
            },
      ),
    );
  }

  function selectQuestionType(
    categoryId: string,
    questionId: string,
    newType: "multiple_choice" | "free_text",
  ) {
    updateQuestion(categoryId, questionId, (question) => {
      if (newType === "multiple_choice") {
        return {
          id: question.id,
          points: question.points,
          prompt: question.prompt,
          questionType: "multiple_choice",
          choices: ["", "", "", ""],
          correctAnswer: "",
        };
      }
      return {
        id: question.id,
        points: question.points,
        prompt: question.prompt,
        questionType: "free_text",
        correctAnswer: "",
      };
    });
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
              <Dialog
                key={question.id}
                open={editingQuestionId === question.id}
                onOpenChange={(isOpen: boolean) =>
                  setEditingQuestionId(isOpen ? question.id : null)
                }
              >
                <DialogTrigger className="bg-[#dcdcdc] p-5 rounded-[10px] w-full">
                  {question.points}
                </DialogTrigger>
                <DialogContent className="font-mono text-xs p-5 w-96">
                  <div className="flex flex-col gap-3">
                    <p className="text-center">
                      {category.name || "Untitled"} {question.points}
                    </p>
                    <label className="text-gray-400 text-xs">Type</label>
                    <select
                      value={question.questionType}
                      onChange={(event) =>
                        selectQuestionType(
                          category.id,
                          question.id,
                          event.target.value as "multiple_choice" | "free_text",
                        )
                      }
                    >
                      <option value="free_text">Text</option>
                      <option value="multiple_choice">Multiple Choice</option>
                    </select>

                    <label className="text-gray-400 text-xs">Question</label>
                    <textarea
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(category.id, question.id, (q) => ({
                          ...q,
                          prompt: event.target.value,
                        }))
                      }
                    />

                    {question.questionType === "free_text" ? (
                      <>
                        <label className="text-gray-400 text-xs">Answer</label>
                        <textarea
                          value={question.correctAnswer}
                          onChange={(event) =>
                            updateQuestion(category.id, question.id, (q) => ({
                              ...q,
                              correctAnswer: event.target.value,
                            }))
                          }
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-gray-400 text-xs">Options</label>
                        {question.choices.map((choice, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={choice === question.correctAnswer}
                              onChange={() =>
                                updateQuestion(category.id, question.id, (q) =>
                                  q.questionType !== "multiple_choice"
                                    ? q
                                    : { ...q, correctAnswer: choice },
                                )
                              }
                            />
                            <textarea
                              className="flex-1"
                              value={choice}
                              onChange={(event) =>
                                updateQuestion(
                                  category.id,
                                  question.id,
                                  (q) => {
                                    if (q.questionType !== "multiple_choice")
                                      return q;
                                    const wasCorrect =
                                      q.choices[index] === q.correctAnswer;
                                    const newChoices = q.choices.map((c, i) =>
                                      i === index ? event.target.value : c,
                                    );
                                    return {
                                      ...q,
                                      choices: newChoices,
                                      correctAnswer: wasCorrect
                                        ? event.target.value
                                        : q.correctAnswer,
                                    };
                                  },
                                )
                              }
                            />
                          </div>
                        ))}
                      </>
                    )}

                    <button onClick={() => setEditingQuestionId(null)}>
                      Save
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SetupPage;
