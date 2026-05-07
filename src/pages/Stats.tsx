import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const ordersData = [
  { month: "Jan", orders: 1200 },
  { month: "Feb", orders: 1800 },
  { month: "Mar", orders: 2400 },
  { month: "Apr", orders: 3100 },
  { month: "May", orders: 3800 },
  { month: "Jun", orders: 4500 },
  { month: "Jul", orders: 5200 },
  { month: "Aug", orders: 6000 },
];

const vendorData = [
  { month: "Jan", vendors: 50 },
  { month: "Feb", vendors: 85 },
  { month: "Mar", vendors: 130 },
  { month: "Apr", vendors: 200 },
  { month: "May", vendors: 280 },
  { month: "Jun", vendors: 370 },
  { month: "Jul", vendors: 440 },
  { month: "Aug", vendors: 500 },
];

const riderData = [
  { name: "Active", value: 320 },
  { name: "On Break", value: 80 },
  { name: "New Signups", value: 50 },
];

const COLORS = ["hsl(152, 60%, 36%)", "hsl(210, 60%, 50%)", "hsl(38, 92%, 55%)"];

const Stats = () => {
  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Company Performance</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A snapshot of how Amairo is growing — real numbers, real impact.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Line Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="hsl(152, 60%, 36%)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vendor Growth Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="vendors" fill="hsl(210, 60%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rider Activity Pie Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Rider Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={riderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                      {riderData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Card className="h-full flex flex-col justify-center">
              <CardContent className="pt-6 space-y-6">
                {[
                  { label: "Total Orders", value: "25,000+", color: "text-primary" },
                  { label: "Active Vendors", value: "500+", color: "text-secondary" },
                  { label: "Total Riders", value: "450+", color: "text-accent" },
                  { label: "Customer Satisfaction", value: "4.8/5", color: "text-primary" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <span className="text-muted-foreground text-sm">{item.label}</span>
                    <span className={`font-display text-2xl font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Stats;
