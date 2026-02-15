'use client';

import { useActionState } from 'react';
import { LogIn } from 'lucide-react';
import { IconInnerShadowTop, IconBrandGithub } from '@tabler/icons-react';
import { login, loginWithGitHub } from '@/actions/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LoginFormState {
  error?: string;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(
    login,
    {}
  );

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <IconInnerShadowTop className="size-8" />
            <span className="text-2xl font-semibold">Orbita</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <form action={loginWithGitHub}>
                <Button type="submit" variant="outline" className="w-full">
                  <IconBrandGithub className="size-4" />
                  Continue with GitHub
                </Button>
              </form>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or
                </span>
              </div>

              <form action={formAction}>
                <div className="grid gap-4">
                  {state.error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                      {state.error}
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      disabled={isPending}
                    />
                  </div>

                  <Button type="submit" className="w-full" loading={isPending}>
                    <LogIn /> Sign In
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-xs text-balance px-6">
          By signing in, you agree to the{' '}
          <a href="#" className="text-primary underline-offset-4 hover:underline">
            Terms of Service
          </a>{' '}
          and the{' '}
          <a href="#" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
    </div>
  );
}
