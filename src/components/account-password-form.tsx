"use client";

import { useActionState, useEffect, useState } from "react";
import { IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";
import { toast } from "sonner";
import { changePassword } from "@/actions/account";
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

interface AccountPasswordFormProps {
  hasPassword: boolean;
}

function PasswordInput({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required
        minLength={8}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
      >
        {visible ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
      </Button>
    </div>
  );
}

export function AccountPasswordForm({ hasPassword }: AccountPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(changePassword, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Password updated successfully");
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconLock className="size-5" />
          Security
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? "Change your password"
            : "Set a password to enable email login"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                placeholder="Enter current password"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : hasPassword ? "Change Password" : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
