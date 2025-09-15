import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';

const carouselData = [
  {
    image: "https://images.unsplash.com/photo-1740933084056-078fac872bff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwbWVldGluZyUyMHN1Y2Nlc3N8ZW58MXx8fHwxNzU3ODU1OTE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Build Something Amazing",
    subtitle: "Join thousands of creators who are transforming their ideas into reality"
  },
  {
    image: "https://images.unsplash.com/photo-1590650046871-92c887180603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwbWVldGluZyUyMHN1Y2Nlc3N8ZW58MXx8fHwxNzU3ODU1OTE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Collaborate Seamlessly",
    subtitle: "Work together with your team in real-time, wherever you are"
  },
  {
    image: "https://images.unsplash.com/photo-1728044849347-ea6ff59d98dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwZ3Jvd3RoJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NTc5MjYzODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Scale with Confidence",
    subtitle: "From startup to enterprise, we grow with your business"
  }
];

export function SignupCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen bg-gradient-to-br from-blue-600 to-purple-700 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={carouselData[currentSlide].image}
            alt={carouselData[currentSlide].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-12">
        <motion.div
          key={`content-${currentSlide}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-md"
        >
          <h1 className="text-white text-4xl mb-4">
            {carouselData[currentSlide].title}
          </h1>
          <p className="text-white/90 text-lg">
            {carouselData[currentSlide].subtitle}
          </p>
        </motion.div>

        <div className="absolute bottom-8 flex space-x-2">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}