import seeksyLogo from "@/assets/Seeksy_Logo_5.png";

export default function LogoAsset() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">Seeksy Logo Asset</h1>
      <p className="text-gray-600 mb-8">Right-click the image below to save</p>
      
      <div className="bg-gray-100 p-8 rounded-lg">
        <img 
          src={seeksyLogo} 
          alt="Seeksy Logo" 
          className="w-[300px] h-auto"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      
      <p className="text-sm text-gray-500 mt-8">
        For 120x120 PNG: Right-click → Save Image As → Resize in any image editor
      </p>
    </div>
  );
}
