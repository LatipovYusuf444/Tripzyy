import { motion } from "framer-motion"

const destinations = [
  {
    title: "BAA",
    desc: "Dubayning zamonaviy arxitekturasi",
    image:
      "https://plus.unsplash.com/premium_photo-1697729914552-368899dc4757?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZHViYWl8ZW58MHx8MHx8fDA%3D",
  },
  {
    title: "Turkiya",
    desc: "Kappadokiya va Istanbul",
    image:
      "https://images.unsplash.com/photo-1527838832700-5059252407fa?q=80&w=1600",
  },
  {
    title: "Tailand",
    desc: "Tropik plyajlar va Bangkok",
    image:
      "https://img.freepik.com/free-photo/landmark-pagoda-doi-inthanon-national-park-chiang-mai-thailand_335224-779.jpg?semt=ais_hybrid&w=740&q=80",
  },
  {
    title: "Vyetnam",
    desc: "Halong ko‘rfazi va tabiat",
    image:
      "https://career-advice.jobs.ac.uk/wp-content/uploads/An-image-of-Vietnam.jpg.optimal.jpg",
  },
  {
    title: "Misr",
    desc: "Sharm-el-Sheyx va dengiz",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr_GgOJuypCJTJnxkB3gStO973yOX1zwoIOQ&s",
  },
  {
    title: "Gruziya",
    desc: "Tbilisi va tog‘lar",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGBucSxmFEERzDGJTezqCEqf9tFE0KZHqRAw&s",
  },
  {
    title: "Italiya",
    desc: "Rim va Venetsiya",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbNNq6CxRHmXciz6TNcGBDgv7k0yqpxLcO6w&s",
  },
  {
    title: "Fransiya",
    desc: "Parij va romantika",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtrVJmJCqDu5mtK3z1XFo7_mArbHExQZqa9Q&s",
  },
  {
    title: "Malayziya",
    desc: "Kuala-Lumpur",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4aJu6cFeYR_EKcW-b-9D7bC_s0T39Akcpmg&s",
  },
  {
    title: "Indoneziya",
    desc: "Bali oroli",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600",
  },
  {
    title: "Uzbekistan",
    desc: "Toshkent Sity",
    image:
      "https://t4.ftcdn.net/jpg/05/99/25/29/360_F_599252956_5APwZ2feMZS4TTRtRcAii5nngoQ714L1.jpg",
  },
  {
    title: "shirinni yaxshi  ko'raman",
    desc: "Portugal Sity",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2HQEy4prAUkXDa876oUfiYoSF9CBgUbqjXg&s",
  },
]

const Napravleniya = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 bg-[#0A1220]">
      <div className="text-center mb-14">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Ommabop yo‘nalishlar
        </h2>
        <div className="w-24 h-1 bg-[#FF7A00] mx-auto my-4 rounded-full" />
        <p className="text-lg md:text-xl text-[#C7CCD6]">
          Eng mashhur va sevimli sayohat yo‘nalishlari
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="relative group rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-[280px] object-cover scale-100 group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-2xl font-bold text-white">
                {item.title}
              </h3>
              <p className="text-sm text-[#D1D5DB] mt-1">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center mt-10">
        <button className="w-[200px] h-[60px] rounded-2xl bg-[#FF7A00] font-semibold">Ko'proq Ko'rish</button>
      </div>
    </section>
  )
}

export default Napravleniya
