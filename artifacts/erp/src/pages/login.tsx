import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast({ title: "Đăng nhập thất bại", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md px-4">
        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 90 L15 30 L35 55 L35 90 Z" fill="white" />
                  <path d="M35 90 L35 55 L50 35 L65 55 L65 90 Z" fill="white" />
                  <path d="M65 90 L65 30 L85 90 Z" fill="white" />
                  <path d="M40 45 L55 25 L70 45" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <circle cx="40" cy="45" r="4" fill="white" />
                  <circle cx="55" cy="25" r="4" fill="white" />
                  <circle cx="70" cy="45" r="4" fill="white" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bứt Phá ERP</h1>
            <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@butpha.vn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang đăng nhập...</> : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
