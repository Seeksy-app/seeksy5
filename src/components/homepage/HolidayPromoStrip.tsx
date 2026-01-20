import { Gift } from "lucide-react";

export const HolidayPromoStrip = () => {
  return (
    <div className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm md:text-base font-semibold">
        <Gift className="h-4 w-4 animate-bounce" />
        <span>
          🎁 Holiday Beta: Try Seeksy Clips + Certified by Seeksy on Polygon — early access for creators and agencies.
        </span>
      </div>
    </div>
  );
};
