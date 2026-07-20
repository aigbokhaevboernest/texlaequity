import { motion } from "framer-motion";

const Vision = () => {
  return (
    <section className="relative bg-[#F5F3EF] py-12 md:py-24 px-6 lg:px-10 overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-xl overflow-hidden max-h-[280px] md:max-h-[420px] mx-auto w-full max-w-[320px] md:max-w-none"
        >
          <img
            src="/images/elon-musk.jpg"
            alt="Elon Musk"
            className="w-full h-full object-cover object-top rounded-xl"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center md:text-left"
        >
          <p className="label-mono text-black/40 text-xs tracking-wider mb-3">
            THE VISION
          </p>
          <h2 className="font-display font-bold text-black text-2xl md:text-5xl leading-tight mb-4">
            Driving the future of sustainable wealth
          </h2>
          <p className="text-black/60 leading-relaxed max-w-md mx-auto md:mx-0 text-sm md:text-base">
            Tesla's mission has always been to accelerate the world's transition to sustainable energy. Our platform extends that same vision to wealth — giving investors a real stake in that future.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Vision;
