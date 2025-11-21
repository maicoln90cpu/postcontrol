import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface GuestListEvent {
  id: string;
  name: string;
  slug: string;
  location: string;
  extra_info: string | null;
  whatsapp_link: string | null;
  agency_phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface EventDialogFormProps {
  event: GuestListEvent | null;
  onSubmit: (data: Partial<GuestListEvent>) => void;
  onCancel: () => void;
}

export function EventDialogForm({ event, onSubmit, onCancel }: EventDialogFormProps) {
  const [formData, setFormData] = useState({
    name: event?.name || "",
    slug: event?.slug || "",
    location: event?.location || "",
    extra_info: event?.extra_info || "",
    whatsapp_link: event?.whatsapp_link || "",
    agency_phone: event?.agency_phone || "",
    is_active: event?.is_active ?? true,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Local *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: DEDGE Club"
          required
        />
        <p className="text-xs text-muted-foreground">
          Nome do estabelecimento/local onde acontecem os eventos
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData({
              ...formData,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            })
          }
          placeholder="exemplo-festa"
          required
        />
        <p className="text-xs text-muted-foreground">
          URL: /lista/{formData.slug || "slug-aqui"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Localização *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="extra_info">Informações Extras</Label>
        <Textarea
          id="extra_info"
          value={formData.extra_info}
          onChange={(e) => setFormData({ ...formData, extra_info: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp_link">Link Grupo WhatsApp</Label>
        <Input
          id="whatsapp_link"
          value={formData.whatsapp_link}
          onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
          placeholder="https://chat.whatsapp.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency_phone">Telefone da Agência</Label>
        <Input
          id="agency_phone"
          value={formData.agency_phone}
          onChange={(e) => setFormData({ ...formData, agency_phone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Evento Ativo</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{event ? "Atualizar" : "Criar"} Evento</Button>
      </DialogFooter>
    </form>
  );
}
