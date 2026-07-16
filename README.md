# 🎉 Jeoparty

A multiplayer, Jeopardy-style trivia game for parties or game nights.
- 👩🏻‍💻 one host controls the board and judges answers
- 📱 players buzz in and answer from their own phones
- 📺 and the live board, questions, and leaderboard are displayed on the TV for everyone to watch together

## Features
- **Realtime, multiplayer sync**: host, player, and display views are all synced throughout the game as questions are revealed, answered, and judged
- **Live scoring + leaderboard**: points are awarded in real time, with a final leaderboard at the end of the game
- **Custom board builder**: hosts can create their own 5x5 board with multiple choice or free-text questions and answers of their choosing
- **Reusable boards**: hosts can load a previous game's board by room code at setup instead of rebuilding from scratch each time
- **No accounts**: players can join using host-provided link or game code

## Stack

- React + React Router
- Typescript
- Tailwind CSS
- Vite
- Supabase Postgres + Realtime
- Vercel
- [Motion Primitives](https://github.com/ibelick/motion-primitives)
