import { motion } from "framer-motion";
import FlightSearch from "./Flightsearch";

const Hero = () => {
  return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 6, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://upload.wikimedia.org/wikipedia/commons/7/7f/ER_Uzbekistan_Airways.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1220]/70 via-[#0A1220]/75 to-[#0A1220]/90" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center justify-center min-h-screen">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mt-10 text-white leading-tight"
          >
            Dunyo bo‘ylab <span className="text-[#FF7A00]">premium</span> sayohat
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-[#C7CCD6] max-w-3xl mx-auto"
          >
            Eng yaxshi reyslar, ishonchli aviakompaniyalar va qulay bron qilish tajribasi.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full mt-12 sm:mt-16 md:mt-20"
          >
            <FlightSearch />
          </motion.div>
        </div>
      </section>
  );
};

export default Hero;
