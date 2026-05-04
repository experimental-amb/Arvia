"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  CheckCircle2, 
  Send,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { n8nRequest } from "@/services/api";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
    };

    try {
      await n8nRequest("create_lead", data);
      setSent(true);
      toast({
        title: "¡Mensaje enviado!",
        description: "Un consultor de Arvia te contactará pronto.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No pudimos enviar tu mensaje. Reintenta por favor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 rounded-3xl text-center space-y-4"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-bold">¡Solicitud Recibida!</h3>
        <p className="text-muted-foreground">Hemos registrado tu interés. Analizaremos tu perfil y te contactaremos en menos de 24h.</p>
      </motion.div>
    );
  }

  return (
    <div className="glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Building2 size={120} />
      </div>
      
      <div className="max-w-xl">
        <h3 className="text-3xl font-bold mb-4">¿Listo para escalar tu agencia?</h3>
        <p className="text-muted-foreground mb-8 text-lg">
          Déjanos tus datos y te mostraremos cómo Arvia puede automatizar el 70% de tu operación comercial.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre</label>
              <Input name="name" placeholder="Tu nombre" required className="bg-white/5 border-white/10 h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
              <Input name="email" type="email" placeholder="tu@email.com" required className="bg-white/5 border-white/10 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono</label>
            <Input name="phone" placeholder="+56 9 ..." className="bg-white/5 border-white/10 h-12" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">¿En qué podemos ayudarte?</label>
            <Textarea name="message" placeholder="Cuéntanos sobre tu inventario..." className="bg-white/5 border-white/10 min-h-[100px]" />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 mt-4 gap-2">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send size={18} /> Enviar Solicitud</>}
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground mt-4">
            Al enviar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </form>
      </div>
    </div>
  );
}
