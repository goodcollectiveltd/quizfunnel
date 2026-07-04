import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { SymptomLander } from "@/components/landers/SymptomLander";
import { symptomBySlug } from "@/data/symptoms";

export default function LanderPage() {
  const { slug } = useParams<{ slug: string }>();
  const symptom = slug ? symptomBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!symptom) return <Navigate to="/" replace />;
  return <SymptomLander symptom={symptom} />;
}
