import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Shield, Zap, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const founders = [
  {
    name: "Founder Name",
    role: "Founder & CEO",
    bio: "Visionary leader passionate about revolutionizing local delivery logistics and empowering small businesses.",
    initials: "FN",
  },
  {
    name: "Co-Founder Name",
    role: "Co-Founder & CTO",
    bio: "Tech enthusiast building scalable platforms that connect communities with reliable delivery services.",
    initials: "CF",
  },
];

const values = [
  { icon: Shield, title: "Reliability", desc: "Every delivery, every time — on schedule and handled with care." },
  { icon: Zap, title: "Speed", desc: "Optimized routes and smart logistics for the fastest delivery experience." },
  { icon: Heart, title: "Community", desc: "Empowering local vendors and creating livelihood for riders." },
  { icon: Users, title: "Transparency", desc: "Real-time tracking and honest pricing for everyone." },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="container py-20 md:py-28">
        <motion.div initial="hidden" animate="visible" className="max-w-3xl mx-auto text-center">
          <motion.h1 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">Amairo</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground leading-relaxed">
            We're on a mission to bridge the gap between local shops and customers by building a reliable, tech-driven delivery ecosystem that benefits everyone — vendors, riders, and customers alike.
          </motion.p>
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-muted/30 py-16">
        <div className="container grid md:grid-cols-2 gap-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Card className="h-full border-2 border-primary/20">
              <CardContent className="pt-8 pb-6">
                <Target className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To empower local vendors with technology, give customers access to the freshest products, and provide riders with fair and flexible earning opportunities — all through one unified platform.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <Card className="h-full border-2 border-secondary/20">
              <CardContent className="pt-8 pb-6">
                <Eye className="h-10 w-10 text-secondary mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become India's most trusted hyperlocal delivery platform — connecting every neighborhood shop with every household, powered by smart logistics and community-first values.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Founders */}
      <section className="container py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground">The people behind Amairo.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {founders.map((f, i) => (
            <motion.div key={f.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Card className="text-center h-full">
                <CardContent className="pt-8 pb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="font-display text-2xl font-bold text-primary">{f.initials}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg">{f.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{f.role}</p>
                  <p className="text-sm text-muted-foreground">{f.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground">What drives us every single day.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full text-center hover:shadow-md transition-shadow">
                  <CardContent className="pt-8 pb-6">
                    <v.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-display font-semibold mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
