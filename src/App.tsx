//import { supabase } from "./lib/supabaseClient";
import { Routes, Route, Navigate } from "react-router-dom";
import SetupPage from "./pages/SetupPage";
import HostPage from "./pages/HostPage";
import PlayPage from "./pages/PlayPage";
import DisplayPage from "./pages/DisplayPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/setup" element={<SetupPage />}></Route>
        <Route path="/host/:roomCode" element={<HostPage />}></Route>
        <Route path="/play/:roomCode" element={<PlayPage />}></Route>
        <Route path="/display/:roomCode" element={<DisplayPage />}></Route>
        <Route path="/" element={<Navigate to="/setup" replace />}></Route>
      </Routes>
    </>
  );
}

export default App;
