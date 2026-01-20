import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function MetaOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // platform (instagram or facebook)
    const error = searchParams.get('error');

    if (error) {
      // User denied or error occurred
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'meta-oauth-error', 
          error 
        }, window.location.origin);
        window.close();
      } else {
        navigate('/integrations');
      }
      return;
    }

    if (code && state) {
      // Success - send code to parent window
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'meta-oauth-success', 
          code, 
          platform: state 
        }, window.location.origin);
        window.close();
      } else {
        // Fallback if not opened in popup
        navigate('/integrations');
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-lg font-medium">Connecting your account...</p>
        <p className="text-sm text-muted-foreground">This window will close automatically</p>
      </div>
    </div>
  );
}
