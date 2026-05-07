import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, ShoppingBag, Bike, BarChart3,
  ArrowRight, Users, Package, MapPin, Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stats = [
  { label: "Active Vendors", value: "500+", icon: Store },
  { label: "Deliveries Completed", value: "25,000+", icon: Package },
  { label: "Happy Customers", value: "10,000+", icon: Users },
  { label: "Cities Covered", value: "15+", icon: MapPin },
];

const steps = [
  { icon: Store, title: "Vendor Stocks", desc: "Vendors update daily inventory by 6-7 AM every morning" },
  { icon: ShoppingBag, title: "Customer Orders", desc: "Customers browse real-time stock and place orders" },
  { icon: Bike, title: "Rider Delivers", desc: "Riders pick up orders with GPS navigation and deliver" },
  { icon: BarChart3, title: "Company Monitors", desc: "Admin oversees quality, approves photos, manages everything" },
];

const testimonials = [
  { name: "Priya S.", role: "Customer", text: "Super fast delivery and always fresh products. Love using Amairo!", rating: 5 },
  { name: "Rajesh K.", role: "Vendor", text: "Managing my shop inventory has never been easier. Great platform for vendors!", rating: 5 },
  { name: "Amit D.", role: "Rider", text: "The GPS tracking and clear delivery instructions make my job smooth.", rating: 4 },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="container relative py-24 md:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6"
            >
              Delivering{" "}
              <span className="text-primary">Freshness</span>{" "}
              From Local Shops to Your Door
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Amairo connects neighborhood vendors with customers through reliable riders — everything you need, one place.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">Learn More</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="border-y border-border bg-muted/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A simple 4-step process that keeps vendors, customers, riders, and the company in sync.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="h-full text-center border-2 hover:border-primary/30 transition-colors">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Step {i + 1}</div>
                  <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What People Say</h2>
            <p className="text-muted-foreground">Trusted by vendors, customers, and riders across the country.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < t.rating ? "text-accent fill-accent" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary text-primary-foreground rounded-2xl p-10 md:p-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join?</h2>
          <p className="opacity-90 max-w-xl mx-auto mb-8">
            Whether you're a vendor, rider, or customer — Amairo has a place for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" variant="secondary">Join as Vendor</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground bg-primary-foreground/15 hover:bg-primary-foreground/25 font-semibold">
                Become a Rider
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Index;
