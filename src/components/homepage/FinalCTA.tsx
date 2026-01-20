import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="bg-slate-950 py-20">
      <div className="container mx-auto px-4 text-center">
        <div 
          className="max-w-2xl mx-auto rounded-3xl p-12 border border-blue-500/20"
          style={{
            background: "linear-gradient(135deg, rgba(44, 107, 237, 0.15) 0%, rgba(5, 56, 119, 0.3) 50%, rgba(44, 107, 237, 0.1) 100%)",
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 mb-6">
            <Sparkles className="h-7 w-7 text-blue-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-slate-300 mb-8 text-lg max-w-md mx-auto">
            Sign up free and unlock the full power of Seeksy's creator toolkit.
          </p>
          <Button
            onClick={() => navigate("/signup-select")}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 px-10 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
          >
            Start Free Today
          </Button>
        </div>
      </div>
    </section>
  );
}
