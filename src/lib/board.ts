export function findRevealedQuestion(categories: any[], questionId: string) {
  for (const category of categories) {
    const question = category.questions.find(
      (q: any) => q.id === questionId,
    );
    if (question) return { question, category };
  }
  return null;
}
