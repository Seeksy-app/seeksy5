import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Instagram, Youtube, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import testimonial1 from "@/assets/homepage/testimonial-1.jpg";
import testimonial2 from "@/assets/homepage/testimonial-2.jpg";
import testimonial3 from "@/assets/homepage/testimonial-3.jpg";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Podcast Host",
    image: testimonial1,
    quote: "Seeksy transformed how I manage my show and helped me land my first brand deal. The studio quality is incredible.",
    rating: 5,
    social: { platform: "instagram", handle: "@sarahchenpod", followers: "45K" },
  },
  {
    name: "Marcus Johnson",
    role: "YouTube Creator",
    image: testimonial2,
    quote: "The analytics dashboard alone is worth it. I finally understand my audience and what content resonates.",
    rating: 5,
    social: { platform: "youtube", handle: "@marcusjohnson", followers: "120K" },
  },
  {
    name: "Isabella Rodriguez",
    role: "Lifestyle Influencer",
    image: testimonial3,
    quote: "Booking guests used to take hours. Now it takes minutes. The media kit generator landed me 3 brand deals!",
    rating: 5,
    social: { platform: "instagram", handle: "@isabellar", followers: "89K" },
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Loved by Creators
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of creators who trust Seeksy to grow their brand
          </p>
        </motion.div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full">
                  {testimonial.social.platform === "instagram" ? (
                    <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Youtube className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {testimonial.social.followers}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonials[currentIndex].quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{testimonials[currentIndex].name}</p>
                  <p className="text-sm text-muted-foreground">{testimonials[currentIndex].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="icon" onClick={goToPrev} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={goToNext} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
