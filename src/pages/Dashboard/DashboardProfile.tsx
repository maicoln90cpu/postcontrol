import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Lock } from 'lucide-react';
import { Profile } from '@/types/dashboard';

/**
 * Dashboard Profile Component
 * 
 * User profile editor with avatar upload, Instagram link, and password change.
 * Memoized to prevent re-renders when parent state changes.
 * 
 * @component
 */

/**
 * User profile data structure (deprecated, use Profile from types/dashboard)
 * @deprecated
 */
interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  instagram?: string;
  gender?: string;
  avatar_url?: string;
  followers_range?: string;
}

/**
 * Props for DashboardProfile component
 */
interface DashboardProfileProps {
  /** User profile data from database */
  profile: Profile;
  /** Preview URL for avatar (before saving) */
  avatarPreview: string | null;
  /** Selected avatar file for upload */
  avatarFile: File | null;
  /** Whether avatar is currently uploading */
  uploading: boolean;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Current Instagram handle value */
  instagram: string;
  /** Selected gender value */
  selectedGender: string;
  /** New password input value */
  newPassword: string;
  /** Password confirmation input value */
  confirmPassword: string;
  /** Whether user is an agency admin */
  isAgencyAdmin: boolean;
  /** Current authenticated user object */
  user: any;
  
  /** Callback when avatar file is selected */
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to save avatar to storage */
  onSaveAvatar: () => void;
  /** Callback when Instagram input changes */
  onInstagramChange: (value: string) => void;
  /** Callback to save Instagram handle */
  onSaveInstagram: () => Promise<void>;
  /** Callback when gender selection changes */
  onGenderChange: (value: string) => void;
  /** Callback to save gender value */
  onSaveGender: () => void;
  /** Callback when new password input changes */
  onNewPasswordChange: (value: string) => void;
  /** Callback when confirm password input changes */
  onConfirmPasswordChange: (value: string) => void;
  /** Callback to change password */
  onChangePassword: () => void;
  /** Callback when followers range changes (auto-saves) */
  onFollowersRangeChange: (value: string) => Promise<void>;
  /** Callback when full name changes (auto-saves on blur) */
  onFullNameChange: (value: string) => Promise<void>;
}

const DashboardProfileComponent = ({
  profile,
  avatarPreview,
  avatarFile,
  uploading,
  uploadProgress,
  instagram,
  selectedGender,
  newPassword,
  confirmPassword,
  isAgencyAdmin,
  user,
  onAvatarChange,
  onSaveAvatar,
  onInstagramChange,
  onSaveInstagram,
  onGenderChange,
  onSaveGender,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onChangePassword,
  onFollowersRangeChange,
  onFullNameChange,
}: DashboardProfileProps) => {
  return (
    <Card className="p-6">
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="senha">Alterar Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b">
            <Avatar className="h-32 w-32 ring-4 ring-primary/20">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-3xl">{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>Alterar Foto</span>
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="hidden"
                />
              </Label>
              {avatarFile && (
                <Button onClick={onSaveAvatar} disabled={uploading}>
                  {uploading ? `${uploadProgress}%` : 'Salvar Foto'}
                </Button>
              )}
            </div>
            {uploading && <Progress value={uploadProgress} className="w-full max-w-xs" />}
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                defaultValue={profile.full_name || ''}
                onBlur={async (e) => {
                  const newName = e.target.value.trim();
                  if (newName && newName !== profile.full_name) {
                    await onFullNameChange(newName);
                  }
                }}
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={profile.email || ''} disabled />
            </div>

            <div>
              <Label>Instagram</Label>
              <div className="flex gap-2">
                <Input
                  value={instagram}
                  onChange={(e) => {
                    let value = e.target.value.trim().replace(/\s/g, '');
                    if (value && !value.startsWith('@')) {
                      value = '@' + value;
                    }
                    onInstagramChange(value.slice(0, 31));
                  }}
                  placeholder="@seu_usuario"
                  maxLength={31}
                />
                <Button
                  onClick={onSaveInstagram}
                  disabled={instagram === profile.instagram || !instagram}
                  size="sm"
                >
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use o formato: @seuusuario (sem espaços)
              </p>
            </div>

            {profile.phone && (
              <div>
                <Label>Telefone</Label>
                <Input value={profile.phone} disabled />
              </div>
            )}

            <div>
              <Label>Gênero</Label>
              <Select value={selectedGender} onValueChange={onGenderChange} disabled={isAgencyAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu gênero" />
                </SelectTrigger>
                <SelectContent>
                  {isAgencyAdmin ? (
                    <SelectItem value="Agência">Agência</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="LGBTQ+">LGBTQ+</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {isAgencyAdmin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Administradores de agência têm gênero fixo como "Agência"
                </p>
              )}
              {selectedGender !== (profile.gender || '') && (
                <Button onClick={onSaveGender} className="mt-2" size="sm">
                  Salvar Gênero
                </Button>
              )}
            </div>

            <div>
              <Label>Faixa de Seguidores</Label>
              <Select
                value={profile.followers_range || ''}
                onValueChange={onFollowersRangeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a faixa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-5k">0 - 5k</SelectItem>
                  <SelectItem value="5k-10k">5k - 10k</SelectItem>
                  <SelectItem value="10k-50k">10k - 50k</SelectItem>
                  <SelectItem value="50k-100k">50k - 100k</SelectItem>
                  <SelectItem value="100k+">100k+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="senha" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
            <Button onClick={onChangePassword} disabled={!newPassword || !confirmPassword} className="w-full">
              <Lock className="mr-2 h-4 w-4" />
              Alterar Senha
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export const DashboardProfile = memo(DashboardProfileComponent);
