import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { sb } from "@/lib/supabaseSafe";
import AgencySignup from "./AgencySignup";

export default function AgencySignupBySlug() {
  const { slug } = useParams<{ slug: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokenBySlug();
  }, [slug]);

  const loadTokenBySlug = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const { data, error } = await sb
      .from('agencies')
      .select('signup_token')
      .eq('slug', slug)
      .maybeSingle();

    if (data?.signup_token) {
      setToken(data.signup_token);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/404" replace />;
  }

  return <AgencySignup tokenFromSlug={token} />;
}
