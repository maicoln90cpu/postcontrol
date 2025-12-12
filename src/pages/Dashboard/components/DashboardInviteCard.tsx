import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { shareViaWhatsApp } from "@/lib/phoneUtils";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { Event } from "@/types/dashboard";

interface DashboardInviteCardProps {
  userId: string;
  agencyId: string;
  agencyName: string;
  events: Event[];
}

export function DashboardInviteCard({
  userId,
  agencyId,
  agencyName,
  events,
}: DashboardInviteCardProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");

  const activeEvents = events?.filter(e => e.is_active) || [];

  const handleInvite = async () => {
    if (!selectedEvent) {
      toast({
        title: "Selecione um evento",
        variant: "destructive",
      });
      return;
    }

    const event = events.find(e => e.id === selectedEvent);
    if (!event) return;

    try {
      // Fetch agency message template
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('invite_message_template')
        .eq('id', agencyId)
        .single();

      const messageTemplate = agencyData?.invite_message_template ||
        'Oi, queria te indicar para ser uma divulgadora da {agencyName}, participar do evento {eventTitle} e ter sua cortesia batendo os requisitos das postagens, chamar o http://bit.ly/Contato_MD para ele te incluir no grupo de Promo';

      // Replace placeholders
      const message = messageTemplate
        .replace('{agencyName}', agencyName)
        .replace('{eventTitle}', event.title);

      // Register analytics
      await supabase.from('referral_analytics').insert({
        user_id: userId,
        agency_id: agencyId,
        event_id: selectedEvent,
      });

      // Open WhatsApp
      await shareViaWhatsApp(message);

      toast({
        title: "WhatsApp aberto!",
        description: "Selecione o contato para enviar o convite.",
      });

      setDialogOpen(false);
      setSelectedEvent("");
    } catch (error) {
      logger.error("Erro ao processar convite:", error);
      toast({
        title: "Erro ao abrir WhatsApp",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 border-[#25D366]/20">
          <div className="flex-col flex items-center justify-between px-[20px] py-[10px]">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-center mx-0">
                <Share2 className="h-5 w-5 text-[#25D366]" />
                Convidar Amiga para Divulgação
              </h3>
              <p className="text-sm text-muted-foreground text-center py-[10px]">
                Indique amigas para participar dos eventos e ganhar cortesias
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-white text-center text-lg"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Convidar Agora
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Event Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Amiga para Divulgação</DialogTitle>
            <DialogDescription>
              Selecione o evento que você deseja indicar para sua amiga participar como divulgadora.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-event">Escolha o Evento</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger id="invite-event">
                  <SelectValue placeholder="Selecione um evento ativo..." />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.length > 0 ? (
                    activeEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Nenhum evento ativo disponível no momento
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={!selectedEvent}
              className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-white"
            >
              Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
