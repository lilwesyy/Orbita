"use client";

import { useActionState, useEffect } from "react";
import { IconUserCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccountProfileFormProps {
  name: string;
  email: string;
  memberSince: string;
}

export function AccountProfileForm({ name, email, memberSince }: AccountProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Profile updated successfully");
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconUserCircle className="size-5" />
            Profile
          </CardTitle>
          <Badge variant="secondary">Member since {memberSince}</Badge>
        </div>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={name}
              placeholder="Your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              placeholder="your@email.com"
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
