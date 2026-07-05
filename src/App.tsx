import { Routes, Route } from "react-router-dom";
import QuizPage from "@/pages/QuizPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizPage />} />
      {/* Symptom landers retired — the quiz is now the whole experience and points
          straight to the Shopify PDP. Old /relief/:slug pages fall through to the quiz. */}
      <Route path="*" element={<QuizPage />} />
    </Routes>
  );
}
