import { PlaneTakeoff, PlaneLanding, CalendarDays, Users } from "lucide-react";

const FlightSearch = () => {
  return (
    <div
      className="
        bg-white/10 backdrop-blur-md
        border border-white/20
        rounded-3xl
        p-4 sm:p-6 md:p-8
        shadow-lg md:shadow-[0_20px_60px_rgba(0,0,0,0.5)]
        w-full
        max-w-7xl
        mx-auto
      "
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0A1220]/70 rounded-xl px-3 py-3">
          <PlaneTakeoff className="text-[#FF7A00]" />
          <input
            type="text"
            placeholder="Qayerdan"
            className="bg-transparent outline-none text-white placeholder:text-[#9CA3AF] w-full text-sm sm:text-base"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0A1220]/70 rounded-xl px-3 py-3">
          <PlaneLanding className="text-[#FF7A00]" />
          <input
            type="text"
            placeholder="Qayerga"
            className="bg-transparent outline-none text-white placeholder:text-[#9CA3AF] w-full text-sm sm:text-base"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0A1220]/70 rounded-xl px-3 py-3">
          <CalendarDays className="text-[#FF7A00]" />
          <input
            type="date"
            className="bg-transparent outline-none text-white w-full text-sm sm:text-base"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0A1220]/70 rounded-xl px-3 py-3">
          <Users className="text-[#FF7A00]" />
          <select className="bg-transparent outline-none text-white w-full text-sm sm:text-base">
            <option className="bg-[#0A1220]">1 Yo'lovchi</option>
            <option className="bg-[#0A1220]">2 Yo'lovchi</option>
            <option className="bg-[#0A1220]">3 Yo'lovchi</option>
          </select>
        </div>
        <button
          className="
            bg-[#FF7A00] text-white font-semibold
            rounded-xl
            hover:shadow-[0_0_25px_rgba(255,122,0,0.6)]
            transition-all duration-300
            hover:scale-105
            py-3
            text-sm sm:text-base
          "
        >
          Qidirish
        </button>
      </div>
    </div>
  );
};

export default FlightSearch;
