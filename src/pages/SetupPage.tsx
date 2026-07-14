import { useState } from "react";
import "./SetupPage.css";

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
  return (
    <div className="setup-page">
      <h1>setup</h1>
      <div className="board">
        {categories.map((category) => (
          <div key={category.id} className="category-column">
            <div className="category-header">{category.name}</div>
            {category.questions.map((question) => (
              <div key={question.id} className="question-card">
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
