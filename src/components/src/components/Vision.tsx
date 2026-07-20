import { motion } from "framer-motion";

const Vision = () => {
  return (
    <section className="relative bg-black py-24 px-6 lg:px-10 overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-xl overflow-hidden"
        >
          <img
            src="/images/elon-musk.jpg"
            alt="Elon Musk"
            className="w-full h-auto object-cover rounded-xl"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <p className="label-mono text-white/40 text-xs tracking-wider mb-4">
            THE VISION
          </p>
          <h2 className="font-display font-bold text-white text-3xl md:text-5xl leading-tight mb-6">
            Driving the future of sustainable wealth
          </h2>
          <p className="text-white/60 leading-relaxed max-w-md">
            Tesla's mission has always been to accelerate the world's transition to sustainable energy. Our platform extends that same vision to wealth — giving investors a real stake in that future.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Vision;
