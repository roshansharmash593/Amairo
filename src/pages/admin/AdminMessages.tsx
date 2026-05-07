import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AdminMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleRead = async (id: string, currentRead: boolean) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !currentRead })
      .eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message.", variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <Layout>
      <section className="container py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-display">Contact Messages</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All messages read"}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No messages yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id} className={!msg.is_read ? "bg-primary/5" : ""}>
                      <TableCell>
                        {msg.is_read ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {msg.name}
                        {!msg.is_read && <Badge variant="default" className="ml-2 text-xs">New</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{msg.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {msg.message}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRead(msg.id, msg.is_read)}
                            title={msg.is_read ? "Mark as unread" : "Mark as read"}
                          >
                            {msg.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMessage(msg.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default AdminMessages;
