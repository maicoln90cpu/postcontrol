import { useState, useEffect, Suspense, lazy } from "react";
import { formatPostName } from "@/lib/postNameFormatter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Upload, ArrowLeft, X, AlertCircle, HelpCircle, RefreshCw, Loader2 } from "lucide-react";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabaseSafe";
import { z } from "zod";
import { EventSlotsCounter } from "@/components/EventSlotsCounter";
import { EventRequirementsDisplay } from "@/components/EventRequirementsDisplay";
import { logger } from "@/lib/logger";

interface Post {
  id: string;
  post_number: number;
  deadline: string;
  event_id: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  setor: string | null;
  producer_name?: string;
  numero_de_vagas: number | null;
  event_image_url: string | null;
  require_instagram_link: boolean;
  event_purpose?: string;
  accept_sales?: boolean;
  accept_posts?: boolean;
  require_profile_screenshot?: boolean;
  require_post_screenshot?: boolean;
  whatsapp_group_url?: string;
  whatsapp_group_title?: string;
  target_gender?: string[];
  ticketer_email?: string;
}

interface EventRequirement {
  id: string;
  required_posts: number;
  required_sales: number;
  description: string;
  display_order: number;
}

// Validation schemas
const submitFormSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  instagram: z.string().trim().min(1, "Instagram é obrigatório").max(50, "Instagram muito longo"),
  phone: z
    .string()
    .trim()
    .regex(/^\(?(\d{2})\)?\s?(\d{4,5})-?(\d{4})$/, "Formato de telefone inválido. Use: (00) 00000-0000"),
  instagramLink: z.string().optional(),
});

const instagramLinkSchema = z
  .string()
  .trim()
  .min(1, "Link do Instagram é obrigatório")
  .refine(
    (val) => val.includes("instagram.com/") || val.startsWith("@"),
    "Formato inválido. Use: https://instagram.com/usuario ou @usuario",
  );

const Submit = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [hasExistingPhone, setHasExistingPhone] = useState(false);
  const [originalInstagram, setOriginalInstagram] = useState(""); // ✅ ITEM 3: Instagram original carregado
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedPost, setSelectedPost] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requirements, setRequirements] = useState<EventRequirement[]>([]);
  const [submissionType, setSubmissionType] = useState<string>("post");
  const [salesProofFile, setSalesProofFile] = useState<File | null>(null);
  const [salesProofPreview, setSalesProofPreview] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  // 🆕 Estados para seleção de perfil
  const [profileScreenshotFile, setProfileScreenshotFile] = useState<File | null>(null);
  const [profileScreenshotPreview, setProfileScreenshotPreview] = useState<string | null>(null);
  const [followersRange, setFollowersRange] = useState<string>("");
  // ✅ FASE 4: Estado para rastrear posts já enviados
  const [userSubmissions, setUserSubmissions] = useState<string[]>([]);
  const [salesCount, setSalesCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0); // ✅ ITEM 3: Contador de postagens
  const [ticketerEmailRequired, setTicketerEmailRequired] = useState(false);
  // 🆕 CORREÇÃO #4: Carregar do localStorage com try-catch
  const [userTicketerEmail, setUserTicketerEmail] = useState(() => {
    if (typeof window === 'undefined') return "";
    try {
      return localStorage.getItem('user_ticketer_email') || "";
    } catch (error) {
      logger.error('Erro ao ler localStorage (user_ticketer_email):', error);
      return "";
    }
  });

  useEffect(() => {
    loadEvents();
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // ✅ ITEM 1: Separar lógica de pré-seleção do evento para rodar DEPOIS dos eventos carregarem
  useEffect(() => {
    if (events.length > 0) {
      const eventContextStr = localStorage.getItem("event_context");
      if (eventContextStr) {
        try {
          const eventContext = JSON.parse(eventContextStr);
          logger.info("[ITEM 1] Pré-selecionando evento do contexto:", eventContext);

          // Verificar se o evento existe na lista carregada
          const eventExists = events.find((e) => e.id === eventContext.eventId);
          if (eventExists) {
            setSelectedEvent(eventContext.eventId); // ✅ ITEM 1 FASE 1: Auto-seleciona evento (já logado ou não)
            logger.info("[ITEM 1] Evento pré-selecionado:", eventExists.title);
          } else {
            logger.warn("[ITEM 1] Evento do contexto não encontrado na lista");
          }

          // Limpar contexto após usar
          localStorage.removeItem("event_context");
        } catch (err) {
          logger.error("[ITEM 1] Erro ao processar contexto do evento:", err);
        }
      }
    }
  }, [events]); // Roda quando events muda

  // Estado de loading para dados do evento
  const [loadingEventData, setLoadingEventData] = useState(false);
  const [eventDataError, setEventDataError] = useState<string | null>(null);

  // 🚀 OTIMIZAÇÃO: Carregar todos os dados do evento em paralelo
  const loadEventDataOptimized = async (eventId: string, type: "post" | "sale", retryCount = 0) => {
    if (!user) return;
    
    setLoadingEventData(true);
    setEventDataError(null);
    setSelectedPost("");
    
    try {
      // GRUPO 1: Queries paralelas independentes
      const [eventResult, requirementsResult, userSubmissionsResult] = await Promise.all([
        sb.from("events").select("event_purpose, ticketer_email").eq("id", eventId).maybeSingle(),
        sb.from("event_requirements").select("*").eq("event_id", eventId).order("display_order", { ascending: true }),
        sb.from("submissions").select("post_id").eq("user_id", user.id).eq("event_id", eventId)
      ]);

      if (eventResult.error) throw eventResult.error;
      if (requirementsResult.error) throw requirementsResult.error;
      
      const eventPurpose = eventResult.data?.event_purpose || "divulgacao";
      const isProfileSelection = eventPurpose === "selecao_perfil";
      
      // Configurar ticketeira
      setTicketerEmailRequired(!!eventResult.data?.ticketer_email);
      setUserTicketerEmail(localStorage.getItem('user_ticketer_email') || "");
      setRequirements(requirementsResult.data || []);
      
      const submittedPostIds = (userSubmissionsResult.data || []).filter((s: any) => s.post_id).map((s: any) => s.post_id);
      setUserSubmissions(submittedPostIds);

      // GRUPO 2: Queries dependentes do tipo (paralelas entre si)
      if (type === "sale") {
        const [salesPostResult, salesCountResult] = await Promise.all([
          sb.from("posts").select("id, post_number, deadline, event_id, post_type")
            .eq("event_id", eventId).eq("post_number", 0).eq("post_type", "sale").maybeSingle(),
          sb.from("submissions").select("*", { count: "exact", head: true })
            .eq("user_id", user.id).eq("event_id", eventId).eq("submission_type", "sale")
        ]);

        if (salesPostResult.data) {
          setPosts([salesPostResult.data]);
          setSelectedPost(salesPostResult.data.id);
        } else {
          setPosts([]);
        }
        setSalesCount(salesCountResult.count || 0);
        setPostsCount(0);
      } else {
        // Posts normais (excluindo #0)
        let postsQuery = sb.from("posts")
          .select("id, post_number, deadline, event_id")
          .eq("event_id", eventId)
          .neq("post_number", 0)
          .gte("deadline", new Date().toISOString())
          .order("deadline", { ascending: true });

        if (submittedPostIds.length > 0 && !isProfileSelection) {
          postsQuery = postsQuery.not("id", "in", `(${submittedPostIds.join(",")})`);
        }
        if (!isProfileSelection) {
          postsQuery = postsQuery.limit(1);
        }

        const [postsResult, postsCountResult] = await Promise.all([
          postsQuery,
          sb.from("submissions").select("*", { count: "exact", head: true })
            .eq("user_id", user.id).eq("event_id", eventId).eq("submission_type", "divulgacao")
        ]);

        const postsData = postsResult.data || [];
        setPosts(postsData);
        setPostsCount(postsCountResult.count || 0);
        setSalesCount(0);

        // Auto-selecionar post único para divulgação
        if (postsData.length === 1 && !isProfileSelection) {
          setSelectedPost(postsData[0].id);
        }
      }

      setLoadingEventData(false);
      logger.info("Dados do evento carregados com sucesso");
    } catch (error: any) {
      logger.error("Erro ao carregar dados do evento:", error);
      
      // Retry com backoff exponencial (máx 3 tentativas)
      if (retryCount < 3) {
        const delay = 1000 * (retryCount + 1);
        logger.info(`Tentando novamente em ${delay}ms... (tentativa ${retryCount + 2}/3)`);
        await new Promise(r => setTimeout(r, delay));
        return loadEventDataOptimized(eventId, type, retryCount + 1);
      }
      
      setEventDataError("Não foi possível carregar os dados. Tente novamente.");
      setLoadingEventData(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadEventDataOptimized(selectedEvent, submissionType as "post" | "sale");
    } else {
      setPosts([]);
      setRequirements([]);
      setSelectedPost("");
      setUserSubmissions([]);
      setSalesCount(0);
      setPostsCount(0);
    }
    logger.info("submissionType mudou:", submissionType);
  }, [selectedEvent, submissionType]);

  const loadEvents = async () => {
    if (!user) {
      setEvents([]);
      return;
    }

    try {
      // 🔧 ITEM 1: Buscar sempre última agência acessada (sem query param)
      const { data: userAgencies, error: agenciesError } = await sb
        .from("user_agencies")
        .select("agency_id")
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false })
        .limit(1);

      if (agenciesError) {
        logger.error("Erro ao buscar agências:", agenciesError);
        toast({
          title: "Erro de configuração",
          description: "Não foi possível carregar suas agências.",
          variant: "destructive",
        });
        return;
      }

      if (!userAgencies || userAgencies.length === 0) {
        toast({
          title: "Sem agência vinculada",
          description: "Você precisa se cadastrar através do link de uma agência.",
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Voltar para Home
            </Button>
          ),
        });
        setEvents([]);
        return;
      }

      const contextAgencyId = userAgencies[0].agency_id;
      setAgencyId(contextAgencyId);

      logger.info("Agência detectada:", {
        agency_id: contextAgencyId,
        user_id: user.id,
      });

      // 2. Atualizar last_accessed_at
      await sb
        .from("user_agencies")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("agency_id", contextAgencyId);

      // 3. Buscar eventos ATIVOS da agência
      const { data, error } = await sb
        .from("events")
        .select(
          "id, title, description, event_date, location, setor, producer_name, numero_de_vagas, event_image_url, require_instagram_link, event_purpose, accept_sales, accept_posts, require_profile_screenshot, require_post_screenshot, whatsapp_group_url, whatsapp_group_title, ticketer_email, target_gender",
        )
        .eq("is_active", true)
        .eq("agency_id", contextAgencyId)
        .order("event_date", { ascending: true });

      if (error) {
        logger.error("Erro ao carregar eventos:", error);
        toast({
          title: "Erro ao carregar eventos",
          description: error.message,
          variant: "destructive",
        });
        setEvents([]);
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum evento disponível",
          description: "Não há eventos ativos no momento. Entre em contato com a agência.",
          variant: "default",
        });
        setEvents([]);
        return;
      }

      logger.info("Eventos carregados:", {
        agency_id: contextAgencyId,
        total: data?.length || 0,
      });

      // ✅ ITEM 1: Filtrar por slug se houver contexto de evento
      const eventContextStr = localStorage.getItem("event_context");
      if (eventContextStr) {
        try {
          const eventContext = JSON.parse(eventContextStr);
          const filteredData = data.filter((e) => e.id === eventContext.eventId);

          if (filteredData.length > 0) {
            logger.info("[ITEM 1] Eventos filtrados por slug:", filteredData[0].title);
            setEvents(filteredData);
            // ⚠️ Não remover event_context aqui - deixar para o useEffect fazer (linha 124-148)
            return;
          }
        } catch (err) {
          logger.error("Erro ao processar contexto do evento:", err);
        }
      }

      setEvents(data);
    } catch (error) {
      logger.error("Erro crítico ao carregar eventos:", error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
      setEvents([]);
    }
  };

  // NOTA: As funções loadPostsForEvent, loadRequirementsForEvent, loadUserSubmissionsForEvent,
  // loadSalesCount e loadPostsCount foram consolidadas em loadEventDataOptimized() para performance

  const loadUserProfile = async () => {
    if (!user) return;

    const { data, error } = await sb
      .from("profiles")
      .select("full_name, email, instagram, phone, followers_range")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("Error loading profile:", error);
      return;
    }

    if (data) {
      setName(data.full_name || "");
      setEmail(data.email || "");
      setInstagram(data.instagram || data.email?.split("@")[0] || "");
      setOriginalInstagram(data.instagram || ""); // ✅ ITEM 3: Salvar instagram original
      setPhone(data.phone || "");
      setHasExistingPhone(!!data.phone);
      // ✅ SPRINT 1 - ITEM 5: Bloquear Instagram se já existe
      if (data.instagram) {
        setInstagram(data.instagram);
      }
      // ✅ SPRINT 1 - ITEM 5: Bloquear Seguidores se já existe
      if (data.followers_range) {
        setFollowersRange(data.followers_range);
      }
    }
  };
  // 🆕 Função para comprimir imagens
  const compressImage = async (file: File, maxWidth: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Redimensionar mantendo proporção
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg", // Sempre converter para JPEG
                  lastModified: Date.now(),
                });
                logger.info(
                  `Imagem comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`,
                );
                resolve(compressedFile);
              } else {
                reject(new Error("Erro ao comprimir imagem"));
              }
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    uploadType: "post" | "sale" | "profile" = "post",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validação de tamanho ANTES de comprimir (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validar tipo de arquivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Use apenas imagens JPG, PNG ou WEBP.",
          variant: "destructive",
        });
        return;
      }

      try {
        // 🆕 COMPRIMIR IMAGEM
        const compressedFile = await compressImage(file, 1080, 0.8);

        // Suporte para 3 tipos de upload
        if (uploadType === "post") {
          setSelectedFile(compressedFile);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
        } else if (uploadType === "sale") {
          setSalesProofFile(compressedFile);
          const reader = new FileReader();
          reader.onloadend = () => {
            setSalesProofPreview(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
        } else if (uploadType === "profile") {
          setProfileScreenshotFile(compressedFile);
          const reader = new FileReader();
          reader.onloadend = () => {
            setProfileScreenshotPreview(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
        }
      } catch (error) {
        logger.error("Erro ao processar imagem:", error);
        toast({
          title: "Erro ao processar imagem",
          description: "Tente novamente ou use outra imagem.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveImage = (uploadType: "post" | "sale" | "profile" = "post") => {
    if (uploadType === "post") {
      setSelectedFile(null);
      setPreviewUrl(null);
    } else if (uploadType === "sale") {
      setSalesProofFile(null);
      setSalesProofPreview(null);
    } else if (uploadType === "profile") {
      setProfileScreenshotFile(null);
      setProfileScreenshotPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para enviar uma postagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar e-mail da ticketeira se obrigatório
    if (ticketerEmailRequired && !userTicketerEmail.trim()) {
      toast({
        title: "E-mail da ticketeira obrigatório",
        description: "Por favor, preencha o e-mail solicitado pela ticketeira.",
        variant: "destructive",
      });
      return;
    }

    if (ticketerEmailRequired && userTicketerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userTicketerEmail.trim())) {
        toast({
          title: "E-mail inválido",
          description: "Por favor, insira um e-mail válido para a ticketeira.",
          variant: "destructive",
        });
        return;
      }
    }

    // M4: Validação aprimorada com mensagens específicas
    try {
      submitFormSchema.parse({ name, email, instagram, phone, instagramLink });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldNames: Record<string, string> = {
          name: "Nome",
          email: "E-mail",
          instagram: "Instagram",
          phone: "Telefone",
        };
        const fieldName = fieldNames[error.errors[0].path[0] as string] || "Campo";
        toast({
          title: `${fieldName} inválido`,
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate Instagram link if required
    const currentEvent = events.find((e) => e.id === selectedEvent);
    if (currentEvent?.require_instagram_link) {
      try {
        instagramLinkSchema.parse(instagramLink);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Link do Instagram inválido",
            description: error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // 🆕 Validação de gênero compatível (Item 2)
    if (selectedEventData?.target_gender && selectedEventData.target_gender.length > 0) {
      // Buscar gênero do perfil do usuário
      const { data: userProfile, error: profileError } = await sb
        .from("profiles")
        .select("gender")
        .eq("id", user.id)
        .single();

      if (profileError) {
        logger.error("Erro ao buscar perfil:", profileError);
      }

      const userGender = userProfile?.gender;

      // Verificar se gênero do usuário está na lista de gêneros aceitos (case-insensitive)
      const genderCompatible =
        !userGender ||
        selectedEventData.target_gender.some((targetG) => targetG.toLowerCase() === userGender.toLowerCase());

      if (!genderCompatible) {
        const genderLabels: Record<string, string> = {
          masculino: "Masculino",
          feminino: "Feminino",
          outro: "Outro",
          "lgbtq+": "LGBTQ+",
          "lgbtqia+": "LGBTQ+",
        };
        const acceptedGenders = selectedEventData.target_gender
          .map((g) => genderLabels[g.toLowerCase()] || g)
          .join(", ");
        const userGenderLabel = userGender ? genderLabels[userGender.toLowerCase()] || userGender : "Não informado";

        toast({
          title: "Gênero Incompatível",
          description: `Este evento aceita apenas submissões de: ${acceptedGenders}. Seu perfil está cadastrado como: ${userGenderLabel}.`,
          variant: "destructive",
        });
        return; // ⛔ Bloquear envio
      }
    }

    if (!selectedEvent) {
      toast({
        title: "Selecione um evento",
        description: "Por favor, selecione um evento.",
        variant: "destructive",
      });
      return;
    }

    // Validar apenas se for tipo "post"
    if (submissionType === "post" && !selectedPost) {
      toast({
        title: "Selecione uma postagem",
        description: "Por favor, selecione qual postagem você está enviando.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validar deadline do post selecionado (dupla verificação de segurança)
    if (submissionType === "post" && selectedPost) {
      const selectedPostData = posts.find((p) => p.id === selectedPost);

      if (selectedPostData) {
        const postDeadline = new Date(selectedPostData.deadline);
        const now = new Date();

        if (now > postDeadline) {
          const postName = formatPostName(
            selectedEventData?.event_purpose === "selecao_perfil" ? "selecao_perfil" : null,
            selectedPostData.post_number,
          );
          toast({
            title: "⏰ Prazo Expirado",
            description: `O prazo para ${postName} expirou em ${postDeadline.toLocaleString("pt-BR")}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // 🆕 Validação para eventos de seleção de perfil
    if (selectedEventData?.event_purpose === "selecao_perfil") {
      // Validar faixa de seguidores
      if (!followersRange) {
        toast({
          title: "Selecione a faixa de seguidores",
          description: "Por favor, selecione quantos seguidores você tem.",
          variant: "destructive",
        });
        return;
      }

      // Validar print do perfil (se obrigatório)
      if (selectedEventData.require_profile_screenshot && !profileScreenshotFile) {
        toast({
          title: "Adicione o print do perfil",
          description: "Por favor, adicione o print do seu perfil do Instagram.",
          variant: "destructive",
        });
        return;
      }

      // Validar print da postagem (se obrigatório)
      if (selectedEventData.require_post_screenshot && !selectedFile) {
        toast({
          title: "Adicione o print da postagem",
          description: "Por favor, adicione o print de uma postagem sua.",
          variant: "destructive",
        });
        return;
      }

      // Validar que ao menos UM post existe para o evento (mesmo que já enviado)
      const { data: eventPosts, error: postsError } = await sb
        .from("posts")
        .select("id")
        .eq("event_id", selectedEvent)
        .limit(1);

      if (postsError || !eventPosts || eventPosts.length === 0) {
        toast({
          title: "Evento sem posts configurados",
          description: "Este evento ainda não possui posts configurados. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validação para eventos normais
      const fileToCheck = submissionType === "post" ? selectedFile : salesProofFile;
      if (!fileToCheck) {
        toast({
          title: submissionType === "post" ? "Adicione o print" : "Adicione o comprovante",
          description:
            submissionType === "post"
              ? "Por favor, adicione o print da sua postagem."
              : "Por favor, adicione o comprovante de venda.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (fileToCheck.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // ✅ FASE 2: Validar duplicata ANTES de inserir
      if (submissionType === "post" && selectedPost) {
        const { data: existingSubmission, error: checkError } = await sb
          .from("submissions")
          .select("id, status")
          .eq("user_id", user!.id)
          .eq("post_id", selectedPost)
          .maybeSingle();

        if (checkError) {
          logger.error("Erro ao verificar duplicata:", checkError);
        }

        if (existingSubmission) {
          const statusMessages: Record<string, string> = {
            pending: "Você já enviou esta postagem e ela está em análise.",
            approved: "Você já enviou esta postagem e ela foi aprovada.",
            rejected: "Você já enviou esta postagem anteriormente. Entre em contato com o administrador.",
          };

          toast({
            title: "Postagem já enviada",
            description: statusMessages[existingSubmission.status] || "Você já enviou esta postagem.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return; // ⛔ BLOQUEIA apenas postagens normais
        }
      } else if (submissionType === "sale") {
        // ✅ Para vendas: PERMITIR múltiplas submissões
        logger.info("[Submit] Comprovante de venda: múltiplas submissões permitidas");
      }

      // Rate limiting check (15 submissions per hour - increased from 5)
      const { data: rateLimitCheck, error: rateLimitError } = await sb.rpc("check_rate_limit", {
        p_user_id: user!.id,
        p_action_type: "submission",
        p_max_count: 15,
        p_window_minutes: 60,
      });

      if (rateLimitError) {
        logger.error("Rate limit check error:", rateLimitError);
      }

      if (rateLimitCheck === false) {
        toast({
          variant: "destructive",
          title: "Limite de envios atingido",
          description: `Você atingiu o limite de 15 submissões por hora. Aguarde alguns minutos para enviar novamente.`,
        });
        setIsSubmitting(false);
        return;
      }

      const post = posts.find((p) => p.id === selectedPost);
      if (post && new Date(post.deadline) < new Date()) {
        toast({
          title: "Prazo expirado",
          description: "O prazo para envio desta postagem já passou.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { data: profile } = await sb
        .from("profiles")
        .select("instagram, full_name, email, phone")
        .eq("id", user.id)
        .single();

      const updateData: any = {
        instagram,
        full_name: name,
        email,
      };

      // Only update phone if it doesn't exist yet
      if (!profile?.phone && phone) {
        updateData.phone = phone;
      }

      if (
        profile &&
        (profile.instagram !== instagram ||
          profile.full_name !== name ||
          profile.email !== email ||
          (!profile.phone && phone))
      ) {
        await sb.from("profiles").update(updateData).eq("id", user.id);
      }

      // 🔄 Upload de screenshot principal
      const fileToUpload =
        submissionType === "post"
          ? selectedFile
          : selectedEventData?.event_purpose === "selecao_perfil" && selectedEventData.require_post_screenshot
            ? selectedFile
            : salesProofFile;
      if (!fileToUpload && selectedEventData?.event_purpose !== "selecao_perfil") throw new Error("No file to upload");

      const insertData: any = {
        user_id: user.id,
        submission_type: submissionType === "post" ? "divulgacao" : submissionType,
      };

      // Helper: Upload com retry automático (3 tentativas)
      const uploadWithRetry = async (file: File, path: string, maxRetries = 3): Promise<void> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { error: uploadError } = await supabase.storage.from("screenshots").upload(path, file);
            if (uploadError) throw uploadError;
            return; // Sucesso
          } catch (error: any) {
            logger.error(`Upload attempt ${attempt}/${maxRetries} failed:`, error);
            if (attempt === maxRetries) {
              // Última tentativa falhou
              throw new Error(`UPLOAD_FAILED: ${error?.message || 'Falha no upload da imagem'}`);
            }
            // Aguardar antes de retry (1s, 2s, 4s - exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          }
        }
      };

      // 🚀 FASE 1: Upload PARALELO das imagens (antes era sequencial ~3-6s, agora ~1.5-3s)
      const uploadPromises: Promise<void>[] = [];
      const timestamp = Date.now();
      
      // 🚀 FASE 2: Simulação de progresso durante upload
      setUploadProgress(10);
      
      // Preparar upload da imagem principal
      let mainFileName: string | null = null;
      if (fileToUpload) {
        const fileExt = fileToUpload.name.split(".").pop();
        mainFileName = `${user.id}/${timestamp}.${fileExt}`;
        uploadPromises.push(uploadWithRetry(fileToUpload, mainFileName));
      }

      // Preparar upload do screenshot do perfil (se for seleção de perfil)
      let profileFileName: string | null = null;
      if (selectedEventData?.event_purpose === "selecao_perfil" && profileScreenshotFile) {
        const profileFileExt = profileScreenshotFile.name.split(".").pop();
        profileFileName = `${user.id}/profile_${timestamp}.${profileFileExt}`;
        uploadPromises.push(uploadWithRetry(profileScreenshotFile, profileFileName));
      }

      // Executar uploads em paralelo com atualização de progresso
      if (uploadPromises.length > 0) {
        setUploadProgress(30);
        await Promise.all(uploadPromises);
        setUploadProgress(70);
      }

      // Atribuir paths após uploads bem-sucedidos
      if (mainFileName) {
        insertData.screenshot_path = mainFileName;
      }
      if (profileFileName) {
        insertData.profile_screenshot_path = profileFileName;
      }

      // 🆕 Adicionar faixa de seguidores (se for seleção de perfil)
      if (selectedEventData?.event_purpose === "selecao_perfil" && followersRange) {
        insertData.followers_range = followersRange;
      }

      // Adicionar e-mail da ticketeira se fornecido
      if (ticketerEmailRequired && userTicketerEmail.trim()) {
        insertData.user_ticketer_email = userTicketerEmail.trim();
        // 🆕 CORREÇÃO #4: Salvar no localStorage para próximas submissões
        localStorage.setItem('user_ticketer_email', userTicketerEmail.trim());
      }

      // ✅ ITEM 5: Verificar se já enviou para seleção de perfil
      if (selectedEventData?.event_purpose === "selecao_perfil" && selectedPost) {
        const { data: existingSubmissions } = await sb
          .from("submissions")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("post_id", selectedPost)
          .in("status", ["pending", "approved"]);

        if (existingSubmissions && existingSubmissions.length > 0) {
          const status = existingSubmissions[0].status;
          const statusText = status === "pending" ? "aguardando aprovação" : "aprovada";

          toast({
            title: "Submissão já existe",
            description: `Você já enviou uma submissão para este evento de seleção de perfil (status: ${statusText}). Aguarde a avaliação ou delete a anterior no seu Dashboard.`,
            variant: "destructive",
          });

          setIsSubmitting(false);
          return;
        }
      }

      // Adicionar post_id e event_id baseado no tipo
      if (submissionType === "post") {
        insertData.post_id = selectedPost;
        // event_id virá do post automaticamente
      } else {
        // Para vendas: validar que post #0 existe antes de inserir
        if (!selectedPost) {
          throw new Error("Selecione o post de venda");
        }

        // Validar que o post existe e é do tipo correto
        const { data: postValidation } = await sb
          .from("posts")
          .select("id, post_number, post_type")
          .eq("id", selectedPost)
          .eq("post_type", "sale")
          .maybeSingle();

        if (!postValidation) {
          throw new Error("Post de venda não encontrado");
        }

        insertData.post_id = selectedPost;
        // event_id virá do post automaticamente via trigger
      }
      setUploadProgress(90);
      const { error } = await sb.from("submissions").insert(insertData);

      if (error) throw error;
      setUploadProgress(100);

      toast({
        title: submissionType === "post" ? "Postagem enviada!" : "Venda enviada!",
        description:
          submissionType === "post"
            ? "Sua postagem foi enviada com sucesso e está em análise."
            : "Seu comprovante de venda foi enviado com sucesso e está em análise.",
      });

      // 🔧 ITEM 1: Redirecionar para /dashboard sem query params
      navigate("/dashboard");

      setSelectedFile(null);
      setPreviewUrl(null);
      setSalesProofFile(null);
      setSalesProofPreview(null);
      setProfileScreenshotFile(null); // 🆕
      setProfileScreenshotPreview(null); // 🆕
      setFollowersRange(""); // 🆕
      setSelectedPost("");
      setSelectedEvent("");
    } catch (error: any) {
      logger.error("Error submitting:", error);
      
      // Identificar tipo de erro e mostrar mensagem específica
      let errorTitle = "Erro ao enviar";
      let errorDescription = "Ocorreu um erro inesperado. Tente novamente.";
      
      const errorMessage = error?.message || '';
      const errorCode = error?.code || '';
      
      if (errorMessage.includes('UPLOAD_FAILED') || errorMessage.includes('storage') || error?.statusCode === 413) {
        errorTitle = "Erro no upload da imagem";
        errorDescription = "Não foi possível enviar a imagem. Verifique sua conexão e o tamanho do arquivo (máx. 5MB).";
      } else if (errorCode === 'PGRST301' || errorMessage.includes('JWT') || errorMessage.includes('expired')) {
        errorTitle = "Sessão expirada";
        errorDescription = "Sua sessão expirou. Faça login novamente.";
        // Redirecionar para login após 2 segundos
        setTimeout(() => navigate('/auth'), 2000);
      } else if (errorCode === '23505' || errorMessage.includes('duplicate')) {
        errorTitle = "Submissão duplicada";
        errorDescription = "Você já enviou esta postagem. Verifique seu Dashboard.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        errorTitle = "Erro de conexão";
        errorDescription = "Conexão instável. Verifique sua internet e tente novamente.";
      } else if (errorMessage.includes('Post de venda não encontrado')) {
        errorTitle = "Post não encontrado";
        errorDescription = "O post de venda não foi encontrado. Selecione outro evento.";
      } else if (errorMessage.includes('No file to upload')) {
        errorTitle = "Imagem obrigatória";
        errorDescription = "Selecione uma imagem para enviar.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <Card className="p-8 shadow-card">
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                    Enviar Postagem
                  </h1>
                  <p className="text-muted-foreground">Preencha seus dados e envie o print da sua postagem no Instagram</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <RefreshDataButton 
                    onRefresh={async () => {
                      await loadEvents();
                      if (selectedEvent) {
                        await loadEventDataOptimized(selectedEvent, submissionType as "post" | "sale");
                      }
                    }}
                    size="sm"
                    variant="outline"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-right max-w-[140px] sm:max-w-none">
                    Postagem não aparece? Clique em Atualizar
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!user && (
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    <Link to="/auth" className="text-primary hover:underline font-medium">
                      Faça login
                    </Link>{" "}
                    para preencher seus dados automaticamente
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="event">Escolher Evento *</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent} required disabled={isSubmitting}>
                  <SelectTrigger id="event" className="bg-background">
                    <SelectValue placeholder={events.length === 0 ? "Carregando eventos..." : "Selecione o evento"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {events.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum evento disponível
                      </SelectItem>
                    ) : (
                      events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}{" "}
                          {event.event_date && `- ${new Date(event.event_date).toLocaleDateString("pt-BR")}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {events.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {events.length} {events.length === 1 ? "evento disponível" : "eventos disponíveis"}
                  </p>
                )}
              </div>

              {/* Skeleton Loading para dados do evento */}
              {loadingEventData && (
                <div className="space-y-4 animate-pulse">
                  <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {/* Erro ao carregar dados do evento */}
              {eventDataError && !loadingEventData && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{eventDataError}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadEventDataOptimized(selectedEvent, submissionType as "post" | "sale")}
                      className="ml-2"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar novamente
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {selectedEvent && selectedEventData && !loadingEventData && !eventDataError && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                  {selectedEventData.event_image_url && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={selectedEventData.event_image_url}
                        alt={selectedEventData.title}
                        className="w-full max-h-64 object-cover rounded-lg border shadow-sm"
                      />
                    </div>
                  )}

                  {selectedEventData.description && (
                    <div className="bg-background/50 rounded-lg p-3 mb-3">
                      <p className="text-sm whitespace-pre-wrap">{selectedEventData.description}</p>
                    </div>
                  )}

                  <h2 className="text-2xl font-bold">{selectedEventData.title}</h2>

                  <div className="space-y-2 text-sm">
                    {selectedEventData.location && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-muted-foreground">Local:</span>
                        <span>{selectedEventData.location}</span>
                      </div>
                    )}
                    {selectedEventData.setor && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-muted-foreground">Setor:</span>
                        <span>{selectedEventData.setor}</span>
                      </div>
                    )}
                    {selectedEventData.producer_name && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-muted-foreground">Produtor(a):</span>
                        <span>{selectedEventData.producer_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Contador de vagas disponíveis em tempo real */}
                  {selectedEventData.numero_de_vagas && (
                    <div className="mt-3">
                      <EventSlotsCounter eventId={selectedEvent} variant="compact" />
                    </div>
                  )}
                </div>
              )}

              {selectedEvent && !loadingEventData && !eventDataError && (
                <>
                  {/* Exibir Tipo de Evento de forma destacada */}
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg border">
                    <Label>Tipo de Evento *</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedEventData?.event_purpose === "selecao_perfil" ? "secondary" : "default"}>
                        {selectedEventData?.event_purpose === "selecao_perfil"
                          ? "👤 Seleção de Perfil"
                          : "📢 Divulgação"}
                      </Badge>
                    </div>
                  </div>

                  {(selectedEventData?.accept_posts || selectedEventData?.accept_sales) && (
                    <div className="space-y-2">
                      <Label>Tipo de Envio *</Label>
                      <Select value={submissionType} onValueChange={setSubmissionType} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedEventData?.accept_posts && <SelectItem value="post">📸 Enviar Postagem</SelectItem>}
                          {selectedEventData?.accept_sales && (
                            <SelectItem value="sale">💰 Enviar Comprovante de Venda</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seleção de postagem para ambos os tipos */}
                  {selectedEvent && (
                    <div className="space-y-2">
                      <Label htmlFor="post-select">
                        {submissionType === "post" ? "Escolha a Postagem *" : "Comprovante de Venda *"}
                      </Label>

                      {posts.length > 0 ? (
                        <>
                          <Select value={selectedPost} onValueChange={setSelectedPost} disabled={isSubmitting}>
                            <SelectTrigger id="post-select" className="w-full bg-background">
                              <SelectValue
                                placeholder={
                                  submissionType === "post"
                                    ? "Selecione qual postagem você está enviando"
                                    : "Postagem #0 (Venda)"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border z-50">
                              {posts.map((post) => {
                                const alreadySubmitted = userSubmissions.includes(post.id);
                                const isExpired = new Date(post.deadline) < new Date();

                                return (
                                  <SelectItem key={post.id} value={post.id} disabled={isExpired || alreadySubmitted}>
                                    <div className="flex items-center gap-2">
                                      <span>
                                        {submissionType === "sale"
                                          ? "💰 Postagem #0 (Venda)"
                                          : `${formatPostName(null, post.post_number, null)} - Prazo: ${new Date(post.deadline).toLocaleDateString("pt-BR")} às ${new Date(post.deadline).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                                      </span>
                                      {alreadySubmitted && submissionType === "post" && (
                                        <Badge variant="secondary" className="text-xs ml-2">
                                          ✓ Já enviada
                                        </Badge>
                                      )}
                                      {isExpired && (
                                        <Badge variant="destructive" className="text-xs ml-2">
                                          ⏰ Prazo expirado
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {selectedPost && submissionType === "post" && (
                            <div className="bg-primary/10 border border-primary rounded-lg p-4 mt-2">
                              <p className="font-semibold text-primary mb-1">📌 Postagem Selecionada:</p>
                              <p className="text-sm">
                                {formatPostName(
                                  selectedEventData?.event_purpose === "selecao_perfil" ? "selecao_perfil" : null,
                                  posts.find((p) => p.id === selectedPost)?.post_number || 0,
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedEventData?.event_purpose === "selecao_perfil"
                                  ? "Você pode enviar múltiplas submissões para esta postagem."
                                  : "Após enviar, a próxima postagem será liberada automaticamente."}
                              </p>
                            </div>
                          )}

                          {selectedPost && submissionType === "post" && (
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-green-700 dark:text-green-300 mb-1">
                                    📝 Postagens Enviadas
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Você já enviou {postsCount} postage{postsCount !== 1 ? "ns" : "m"} para este evento
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-2xl px-4 py-2">
                                  {postsCount}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {selectedPost && submissionType === "sale" && (
                            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                    💰 Comprovantes Enviados
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Você já enviou {salesCount} comprovante{salesCount !== 1 ? "s" : ""} de venda para
                                    este evento
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-2xl px-4 py-2">
                                  {salesCount}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground text-center">
                            {submissionType === "post"
                              ? "⏰ Nenhuma postagem dentro do prazo disponível"
                              : "💰 Post de venda será criado automaticamente"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {requirements.length > 0 && (
                    <EventRequirementsDisplay eventId={selectedEvent} variant="compact" />
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting || !!user}
                />
                {user && <p className="text-xs text-muted-foreground">Email bloqueado quando logado</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  Instagram *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-56">
                        Digite apenas seu usuário do Instagram, sem @ e sem espaços. Exemplo: seunome
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="instagram"
                  placeholder="@seuinstagram"
                  value={instagram}
                  onChange={(e) => {
                    // Remove espaços e garante formato @usuario
                    let value = e.target.value.trim().replace(/\s/g, "");
                    if (value && !value.startsWith("@")) {
                      value = "@" + value;
                    }
                    setInstagram(value.slice(0, 31)); // @ + 30 caracteres
                  }}
                  required
                  maxLength={31}
                  disabled={isSubmitting}
                />
                {instagram && originalInstagram && instagram !== originalInstagram && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    ⚠️ Você está alterando seu Instagram. Certifique-se de que está correto.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  Telefone *
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-56">Digite seu número com DDD. Formato: (00) 00000-0000</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isSubmitting || hasExistingPhone}
                />
                {hasExistingPhone && (
                  <p className="text-xs text-muted-foreground">
                    Telefone bloqueado após o primeiro envio. Entre em contato com o admin para alterações.
                  </p>
                )}
              </div>

              {ticketerEmailRequired && (
                <div className="space-y-2 p-4 border-2 border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📧</span>
                    <div className="flex-1">
                      <Label htmlFor="userTicketerEmail" className="font-semibold flex items-center gap-1">
                        E-mail para {events.find((e) => e.id === selectedEvent)?.ticketer_email || "Ticketeira"} *
                        <span className="text-red-500">★</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Informe o seu e-mail da ticketeira informada</p>
                    </div>
                  </div>
                  <Input
                    id="userTicketerEmail"
                    type="email"
                    placeholder="seu-email-secundario@exemplo.com"
                    value={userTicketerEmail}
                    onChange={(e) => setUserTicketerEmail(e.target.value)}
                    required={ticketerEmailRequired}
                    disabled={isSubmitting}
                    className="bg-white dark:bg-gray-900"
                  />
                </div>
              )}

              {selectedEventData?.require_instagram_link && (
                <div className="space-y-2">
                  <Label htmlFor="instagramLink">Link do Instagram *</Label>
                  <Input
                    id="instagramLink"
                    placeholder="https://instagram.com/seuusuario ou @seuusuario"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                    required={selectedEventData.require_instagram_link}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Insira o link completo do seu perfil ou seu @ do Instagram
                  </p>
                </div>
              )}

              {/* Grupo WhatsApp com título customizável */}
              {selectedEventData?.event_purpose === "selecao_perfil" && selectedEventData?.whatsapp_group_url && (
                <div className="space-y-2 p-4 border-2 border-green-200 rounded-lg bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <Label className="font-semibold">
                        {selectedEventData.whatsapp_group_title || "Grupo WhatsApp de Resultados"}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Entre no grupo para receber os resultados da seleção
                      </p>
                    </div>
                  </div>
                  <a
                    href={selectedEventData.whatsapp_group_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button type="button" className="w-full bg-green-600 hover:bg-green-700">
                      Grupo MDAccula - Resultado da Seleção
                    </Button>
                  </a>
                </div>
              )}

              {/* 🆕 Campos específicos para Seleção de Perfil */}
              {selectedEventData?.event_purpose === "selecao_perfil" && (
                <>
                  {/* Select de Faixa de Seguidores */}
                  <div className="space-y-2">
                    <Label htmlFor="followersRange">Quantos seguidores você tem? *</Label>
                    <Select
                      value={followersRange || ""}
                      onValueChange={setFollowersRange}
                      required
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="followersRange">
                        <SelectValue placeholder="Selecione a faixa de seguidores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5k">1.000 a 5.000 seguidores</SelectItem>
                        <SelectItem value="5-10k">5.000 a 10.000 seguidores</SelectItem>
                        <SelectItem value="10k+">10.000+ seguidores</SelectItem>
                        <SelectItem value="50k+">50.000+ seguidores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload do Print do Perfil */}
                  {selectedEventData.require_profile_screenshot && (
                    <div className="space-y-2">
                      <Label htmlFor="profileScreenshot">Print do Perfil do Instagram *</Label>
                      {profileScreenshotPreview ? (
                        <div className="relative max-w-sm mx-auto">
                          <AspectRatio ratio={9 / 16}>
                            <img
                              src={profileScreenshotPreview}
                              alt="Preview do perfil"
                              className="w-full h-full object-cover rounded-lg border"
                            />
                          </AspectRatio>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveImage("profile")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            {profileScreenshotFile?.name}
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                          <input
                            id="profileScreenshot"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "profile")}
                            className="hidden"
                            required
                          />
                          <label htmlFor="profileScreenshot" className="cursor-pointer">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Clique para fazer upload do print do seu perfil
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG ou JPEG (Max. 5MB)</p>
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        📸 Faça um print da página inicial do seu perfil mostrando seu @ e quantidade de seguidores
                      </p>
                    </div>
                  )}

                  {/* Upload do Print da Postagem (condicional) */}
                  {selectedEventData.require_post_screenshot && (
                    <div className="space-y-2">
                      <Label htmlFor="postScreenshot">Print do Post do Evento *</Label>
                      {previewUrl ? (
                        <div className="relative max-w-sm mx-auto">
                          <AspectRatio ratio={9 / 16}>
                            <img
                              src={previewUrl}
                              alt="Preview da postagem"
                              className="w-full h-full object-cover rounded-lg border"
                            />
                          </AspectRatio>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveImage("post")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2 text-center">{selectedFile?.name}</p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                          <input
                            id="postScreenshot"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "post")}
                            className="hidden"
                            required
                          />
                          <label htmlFor="postScreenshot" className="cursor-pointer">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Clique para fazer upload do print de uma postagem
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG ou JPEG (Max. 5MB)</p>
                          </label>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        📸 Faça um print do post relacionado a este evento
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Upload único para eventos normais (não seleção de perfil) */}
              {selectedEventData?.event_purpose !== "selecao_perfil" && (
                <div className="space-y-2">
                  <Label htmlFor="screenshot">
                    {submissionType === "post" ? "Print da Postagem *" : "Comprovante de Venda *"}
                  </Label>
                  {(submissionType === "post" ? previewUrl : salesProofPreview) ? (
                    <div className="relative max-w-sm mx-auto">
                      <AspectRatio ratio={9 / 16}>
                        <img
                          src={submissionType === "post" ? previewUrl! : salesProofPreview!}
                          alt={submissionType === "post" ? "Preview da postagem" : "Preview do comprovante"}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                      </AspectRatio>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveImage(submissionType === "post" ? "post" : "sale")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        {(submissionType === "post" ? selectedFile : salesProofFile)?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, submissionType === "post" ? "post" : "sale")}
                        className="hidden"
                        required
                      />
                      <label htmlFor="screenshot" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          {submissionType === "post"
                            ? "Clique para fazer upload do print"
                            : "Clique para fazer upload do comprovante"}
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou JPEG (Max. 10MB)</p>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* 🚀 FASE 2: Barra de progresso durante upload */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress < 30 ? "Preparando..." : 
                     uploadProgress < 70 ? "Enviando imagens..." : 
                     uploadProgress < 90 ? "Finalizando upload..." : 
                     uploadProgress < 100 ? "Salvando submissão..." : "Concluído!"}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                size="lg"
                disabled={
                  isSubmitting ||
                  !selectedEvent ||
                  (selectedEventData?.event_purpose !== "selecao_perfil" &&
                    submissionType === "post" &&
                    posts.length === 0)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : submissionType === "post" ? "Enviar Postagem" : "Enviar Comprovante"}
              </Button>
            </form>
          </Card>

          <div className="mt-8 p-6 bg-card/50 backdrop-blur-sm rounded-lg border">
            <h3 className="font-semibold mb-2">📋 Informações Importantes</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Certifique-se de que o print mostra claramente sua postagem</li>
              <li>• Cada postagem aprovada vale 1 ponto</li>
              <li>• Fique atento aos prazos e condições de cada evento</li>
            </ul>
          </div>
        </div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Verifique se os dados estão corretos antes de enviar:</p>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-foreground">
                  <p>
                    <strong>Nome:</strong> {name}
                  </p>
                  <p>
                    <strong>E-mail:</strong> {email}
                  </p>
                  <p>
                    <strong>Instagram:</strong> {instagram}
                  </p>
                  <p>
                    <strong>Evento:</strong> {selectedEventData?.title}
                  </p>
                  <p>
                    <strong>Postagem:</strong>{" "}
                    {formatPostName(
                      selectedEventData?.event_purpose === "selecao_perfil" ? "selecao_perfil" : null,
                      posts.find((p) => p.id === selectedPost)?.post_number || 0,
                    )}
                  </p>
                </div>
                <p className="text-sm">Deseja confirmar o envio?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmit}>Confirmar Envio</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Submit;
