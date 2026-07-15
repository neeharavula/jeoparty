import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/motion-primitives/dialog";
import { supabase } from "@/lib/supabaseClient";
import { getCategoryColorClass } from "@/lib/board";

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

/* shape of a question row as stored in Supabase */
type QuestionRow = {
  points: number;
  prompt: string;
  question_type: "multiple_choice" | "free_text";
  choices: string[] | null;
  correct_answer: string | null;
};

/* fetch an existing game's board from Supabase and map it into draft shape */
async function fetchGameAsDraft(roomCode: string): Promise<CategoryDraft[] | null> {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (gameError || !game) {
    console.error(gameError);
    return null;
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*, questions(*)")
    .eq("game_id", game.id)
    .order("sort_order")
    .order("points", { referencedTable: "questions" });

  if (categoriesError || !categories) {
    console.error(categoriesError);
    return null;
  }

  return categories.map((category) => ({
    id: crypto.randomUUID(),
    name: category.name ?? "",
    questions: category.questions.map((question: QuestionRow) =>
      question.question_type === "multiple_choice"
        ? {
            id: crypto.randomUUID(),
            points: question.points,
            prompt: question.prompt,
            questionType: "multiple_choice",
            choices: question.choices ?? ["", "", "", ""],
            correctAnswer: question.correct_answer ?? "",
          }
        : {
            id: crypto.randomUUID(),
            points: question.points,
            prompt: question.prompt,
            questionType: "free_text",
            correctAnswer: question.correct_answer ?? "",
          },
    ),
  }));
}

/* generate a short room code, avoiding visually ambiguous characters */
function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}

type GameLinks = {
  play: string;
  host: string;
  display: string;
};

/* setup page */
function SetupPage() {
  const [categories, setCategories] = useState<CategoryDraft[]>(initBoard);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameLinks, setGameLinks] = useState<GameLinks | null>(() => {
    const stored = localStorage.getItem("jeoparty-game-links");
    return stored ? JSON.parse(stored) : null;
  });
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [loadRoomCode, setLoadRoomCode] = useState("");
  const [isLoadingSet, setIsLoadingSet] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 1500);
  }

  async function loadQuestionSet() {
    const roomCode = loadRoomCode.trim().toUpperCase();
    if (!roomCode) return;

    setIsLoadingSet(true);
    setLoadError(null);

    const draft = await fetchGameAsDraft(roomCode);

    if (!draft) {
      setLoadError("No game found with that room code.");
    } else {
      setCategories(draft);
      setGameLinks(null);
      localStorage.removeItem("jeoparty-game-links");
    }

    setIsLoadingSet(false);
  }

  async function generateGame() {
    setIsGenerating(true);
    const roomCode = generateRoomCode();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({ room_code: roomCode, status: "setup" })
      .select()
      .single();

    if (gameError || !game) {
      console.error(gameError);
      setIsGenerating(false);
      return;
    }

    for (const [index, category] of categories.entries()) {
      const { data: categoryRow, error: categoryError } = await supabase
        .from("categories")
        .insert({ game_id: game.id, name: category.name, sort_order: index })
        .select()
        .single();

      if (categoryError || !categoryRow) {
        console.error(categoryError);
        continue;
      }

      const questionRows = category.questions.map((question) => ({
        category_id: categoryRow.id,
        points: question.points,
        prompt: question.prompt,
        question_type: question.questionType,
        choices:
          question.questionType === "multiple_choice"
            ? question.choices
            : null,
        correct_answer: question.correctAnswer,
        state: "unplayed",
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionRows);

      if (questionsError) {
        console.error(questionsError);
      }
    }

    const origin = window.location.origin;
    const links = {
      play: `${origin}/play/${roomCode}`,
      host: `${origin}/host/${roomCode}`,
      display: `${origin}/display/${roomCode}`,
    };
    setGameLinks(links);
    localStorage.setItem("jeoparty-game-links", JSON.stringify(links));
    setIsGenerating(false);
  }

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
    <div className="min-h-screen flex flex-col">
      <h1 className="text-center pt-4 m-0">Jeoparty</h1>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-1 font-mono text-sm">
        <div className="flex gap-2">
          <input
            className="bg-[#dcdcdc] rounded-[10px] p-2 border-none font-mono text-sm text-center text-[var(--placeholder-text)]"
            placeholder="Past Game Code"
            value={loadRoomCode}
            onChange={(event) => setLoadRoomCode(event.target.value)}
          />
          <button
            className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer"
            onClick={loadQuestionSet}
            disabled={isLoadingSet || !loadRoomCode.trim()}
          >
            {isLoadingSet ? "Loading..." : "Load Board"}
          </button>
        </div>
        {loadError && <p className="text-xs text-red-500">{loadError}</p>}
      </div>

      <div className="flex justify-center gap-6 font-mono text-sm">
        {categories.map((category, categoryIndex) => (
          <div key={category.id} className="flex flex-col gap-4 w-48">
            <input
              className={`${getCategoryColorClass(categoryIndex)} p-3 rounded-[10px] border-none font-offbit text-xl text-center text-[var(--category-header-text)] shadow-sm transition-transform duration-300 ease-out hover:scale-95`}
              placeholder="Category"
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
                <DialogTrigger className="bg-[var(--tile-unplayed-bg)] p-6 rounded-[10px] w-full shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer">
                  <span className="font-offbit text-xl tracking-wider text-[var(--tile-unplayed-text)]">
                    {question.points}
                  </span>
                </DialogTrigger>
                <DialogContent className="font-mono text-xs p-5 w-96">
                  <div className="flex flex-col gap-3">
                    <p className="text-center">
                      {category.name || "Untitled"} {question.points}
                    </p>
                    <label className="text-gray-400 text-xs">Type</label>
                    <select
                      className="bg-[#dcdcdc] rounded-[10px] p-2 text-[var(--placeholder-text)]"
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
                      className="bg-[#dcdcdc] rounded-[10px] p-2 text-[var(--placeholder-text)]"
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
                          className="bg-[#dcdcdc] rounded-[10px] p-2 text-[var(--placeholder-text)]"
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
                              className="flex-1 bg-[#dcdcdc] rounded-[10px] p-2 text-[var(--placeholder-text)]"
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

                    <button
                      className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer"
                      onClick={() => setEditingQuestionId(null)}
                    >
                      Save
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ))}
      </div>

      <button
        className="bg-[#6b93a6] text-white rounded-[10px] p-2 shadow-sm transition-transform duration-300 ease-out hover:scale-95 cursor-pointer font-mono text-sm"
        onClick={generateGame}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Game"}
      </button>

      {gameLinks && (
        <div className="flex gap-8 font-mono text-sm">
          {(
            [
              { label: "Play", url: gameLinks.play },
              { label: "Host", url: gameLinks.host },
              { label: "Display", url: gameLinks.display },
            ] as const
          ).map(({ label, url }) => (
            <div key={label} className="flex items-center gap-1">
              <a href={url} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
              <button
                className="cursor-pointer text-gray-400"
                onClick={() => copyLink(url)}
                aria-label="Copy link"
              >
                {copiedLink === url ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default SetupPage;
