import { Routes, Route } from "react-router-dom";
import QuizPage from "@/pages/QuizPage";
import LanderPage from "@/pages/LanderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizPage />} />
      <Route path="/relief/:slug" element={<LanderPage />} />
      <Route path="*" element={<QuizPage />} />
    </Routes>
  );
}
