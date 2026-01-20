import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function DropboxCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (window.opener) {
      window.opener.postMessage({
        type: 'dropbox-callback',
        code,
        error
      }, window.location.origin);
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Connecting Dropbox...</h2>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
}
