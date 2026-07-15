const categoryColorClasses = [
  "bg-[var(--category-1)]",
  "bg-[var(--category-2)]",
  "bg-[var(--category-3)]",
  "bg-[var(--category-4)]",
  "bg-[var(--category-5)]",
];

export function getCategoryColorClass(index: number): string {
  return categoryColorClasses[index % categoryColorClasses.length];
}

export function findRevealedQuestion(categories: any[], questionId: string) {
  for (const category of categories) {
    const question = category.questions.find(
      (q: any) => q.id === questionId,
    );
    if (question) return { question, category };
  }
  return null;
}
